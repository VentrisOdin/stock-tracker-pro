
import { useEffect, useState } from "react";
import { Box, Heading, HStack, Input, Select, Button, Table, Thead, Tr, Th, Tbody, Td, VStack } from "@chakra-ui/react";
import { addTx, listTx } from "../api";

export default function Transactions(){
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ symbol: "MSFT", qty: 1, price: 100, side: "BUY", currency: "GBP" });

  const refresh = async ()=>{ setRows(await listTx()); };
  useEffect(()=>{ refresh(); }, []);

  const save = async ()=>{
    await addTx(form.symbol.toUpperCase(), Number(form.qty), Number(form.price), form.side, form.currency);
    setForm({ symbol: "MSFT", qty: 1, price: 100, side: "BUY", currency: "GBP" });
    refresh();
  };

  return (
    <VStack align="stretch" spacing={6}>
      <Heading size="lg">Transactions</Heading>
      <HStack>
        <Input placeholder="Symbol" value={form.symbol} onChange={e=>setForm({...form, symbol: e.target.value})} w="120px"/>
        <Input type="number" placeholder="Qty" value={form.qty} onChange={e=>setForm({...form, qty: Number(e.target.value)})} w="100px"/>
        <Input type="number" placeholder="Price" value={form.price} onChange={e=>setForm({...form, price: Number(e.target.value)})} w="120px"/>
        <Select value={form.side} onChange={e=>setForm({...form, side: e.target.value})} w="120px">
          <option>BUY</option><option>SELL</option>
        </Select>
        <Select value={form.currency} onChange={e=>setForm({...form, currency: e.target.value})} w="120px">
          <option>GBP</option><option>USD</option><option>EUR</option>
        </Select>
        <Button onClick={save} colorScheme="blue">Add</Button>
      </HStack>

      <Box>
        <Table size="sm">
          <Thead><Tr><Th>ID</Th><Th>Symbol</Th><Th isNumeric>Qty</Th><Th isNumeric>Price</Th><Th>Side</Th><Th>Currency</Th></Tr></Thead>
          <Tbody>
            {rows.map((r:any)=>(
              <Tr key={r.id}><Td>{r.id}</Td><Td>{r.symbol}</Td><Td isNumeric>{r.qty}</Td><Td isNumeric>{r.price}</Td><Td>{r.side}</Td><Td>{r.currency}</Td></Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );
}
