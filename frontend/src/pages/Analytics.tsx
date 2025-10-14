
import { useEffect, useState } from "react";
import { Box, Heading, HStack, Select, VStack, Spinner } from "@chakra-ui/react";
import { getState, history, forecast } from "../api";
import CandleChart from "../components/Chart";
import ForecastBand from "../components/ForecastBand";

export default function Analytics(){
  const [syms, setSyms] = useState<string[]>([]);
  const [sel, setSel] = useState<string>("MSFT");
  const [bars, setBars] = useState<any[]>([]);
  const [fc, setFc] = useState<any|null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (sym:string) => {
    setLoading(true);
    const h = await history(sym, "1y", "1d");
    setBars(h.bars||[]);
    try {
      const f = await forecast(sym, 300, 252);
      setFc(f);
    } catch(e) { setFc(null); }
    setLoading(false);
  };

  useEffect(()=>{
    (async ()=>{
      const s = await getState();
      const list = s.watchlist || [];
      setSyms(list);
      const first = list[0] ?? "MSFT";
      setSel(first);
      load(first);
    })();
  }, []);

  return (
    <VStack align="stretch" spacing={6}>
      <HStack>
        <Heading size="lg">Analytics</Heading>
        <Select value={sel} onChange={e=>{setSel(e.target.value); load(e.target.value);}} maxW="200px">
          {syms.map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
      </HStack>
      {loading ? <Spinner/> :
      <>
        <Box>
          <Heading size="sm" mb={2}>{sel} • 1Y Candles</Heading>
          <CandleChart bars={bars}/>
        </Box>
        <Box>
          <Heading size="sm" mb={2}>Forecast (10-50-90% bands)</Heading>
          {fc ? <ForecastBand p10={fc.p10} p50={fc.p50} p90={fc.p90}/> : <Box>No forecast available.</Box>}
        </Box>
      </>}
    </VStack>
  );
}
