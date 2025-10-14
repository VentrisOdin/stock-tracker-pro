
import { useEffect, useMemo, useState } from "react";
import { Box, Heading, Table, Thead, Tr, Th, Tbody, Td, Stat, StatLabel, StatNumber, HStack, Button, Input, Select, VStack, Spacer } from "@chakra-ui/react";
import { listHoldings, upsertHolding, removeHolding, quotes } from "../api";

export default function Portfolio(){
  const [rows, setRows] = useState<any[]>([]);
  const [qmap, setQmap] = useState<Record<string, any>>({});
  const [form, setForm] = useState({ symbol: "MSFT", quantity: 1, avg_cost: 100, currency: "GBP" });

  const refresh = async ()=>{
    const holds = await listHoldings();
    setRows(holds);
    if (holds.length){
      const qm = await quotes(holds.map((h:any)=>h.symbol));
      setQmap(qm);
    }
  };
  useEffect(()=>{ refresh(); }, []);

  const totals = useMemo(()=>{
    const withLive = rows.map((h:any)=>{
      const price = qmap[h.symbol]?.price ?? 0;
      const value = price * h.quantity;
      const cost = h.avg_cost * h.quantity;
      return { ...h, price, value, cost, pnl: value - cost };
    });
    const totalValue = withLive.reduce((a,b)=>a+b.value,0);
    const totalCost = withLive.reduce((a,b)=>a+b.cost,0);
    return { totalValue, totalCost, totalPnl: totalValue-totalCost, rows: withLive };
  }, [rows, qmap]);

  const save = async ()=>{
    await upsertHolding(form.symbol.toUpperCase(), Number(form.quantity), Number(form.avg_cost), form.currency);
    setForm({ symbol: "MSFT", quantity: 1, avg_cost: 100, currency: "GBP" });
    refresh();
  };

  return (
    <VStack align="stretch" spacing={6}>
      <HStack>
        <Heading size="lg">Portfolio</Heading>
        <Spacer/>
        <HStack>
          <Input placeholder="Symbol" value={form.symbol} onChange={e=>setForm({...form, symbol: e.target.value})} w="120px"/>
          <Input type="number" placeholder="Qty" value={form.quantity} onChange={e=>setForm({...form, quantity: Number(e.target.value)})} w="100px"/>
          <Input type="number" placeholder="Avg Cost" value={form.avg_cost} onChange={e=>setForm({...form, avg_cost: Number(e.target.value)})} w="120px"/>
          <Select value={form.currency} onChange={e=>setForm({...form, currency: e.target.value})} w="120px">
            <option>GBP</option><option>USD</option><option>EUR</option>
          </Select>
          <Button onClick={save} colorScheme="blue">Save/Update</Button>
        </HStack>
      </HStack>

      <HStack spacing={12}>
        <Stat><StatLabel>Total Value</StatLabel><StatNumber>£{totals.totalValue.toFixed(2)}</StatNumber></Stat>
        <Stat><StatLabel>Total Cost</StatLabel><StatNumber>£{totals.totalCost.toFixed(2)}</StatNumber></Stat>
        <Stat><StatLabel>P/L</StatLabel><StatNumber color={totals.totalPnl>=0?"green.300":"red.300"}>£{totals.totalPnl.toFixed(2)}</StatNumber></Stat>
      </HStack>

      <Box>
        <Table size="sm" variant="simple">
          <Thead><Tr><Th>Symbol</Th><Th isNumeric>Qty</Th><Th isNumeric>Avg Cost</Th><Th isNumeric>Price</Th><Th isNumeric>Value</Th><Th isNumeric>P/L</Th></Tr></Thead>
          <Tbody>
            {totals.rows.map((r:any)=> (
              <Tr key={r.symbol}>
                <Td>{r.symbol}</Td>
                <Td isNumeric>{r.quantity}</Td>
                <Td isNumeric>£{r.avg_cost.toFixed(2)}</Td>
                <Td isNumeric>{r.price ? `£${r.price.toFixed(2)}` : "—"}</Td>
                <Td isNumeric>£{r.value.toFixed(2)}</Td>
                <Td isNumeric style={{ color: r.pnl>=0 ? "lightgreen" : "salmon" }}>£{r.pnl.toFixed(2)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );
}
