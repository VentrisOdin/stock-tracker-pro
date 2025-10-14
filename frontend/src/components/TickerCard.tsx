
import { Box, HStack, Heading, Text, Badge, VStack, Skeleton } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { quotes, spark } from "../api";

export default function TickerCard({ symbol }:{ symbol: string }) {
  const [price, setPrice] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>("");
  const [trend, setTrend] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const q = await quotes([symbol]);
    const d = q[symbol];
    setPrice(d?.price ?? null);
    setCurrency(d?.currency ?? "");
    const sp = await spark(symbol);
    setTrend(sp.closes ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [symbol]);

  const w = 100, h = 34;
  const min = Math.min(...trend, 0), max = Math.max(...trend, 1);
  const path = trend.map((v,i)=>{
    const x = (i/(trend.length-1||1))*w;
    const y = h - ((v-min)/(max-min||1))*h;
    return `${i===0?'M':'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  return (
    <Box bg="#101528" border="1px solid #1f2433" p={4} rounded="2xl" shadow="md" minW="260px">
      <VStack align="start" spacing={2}>
        <Heading size="sm">{symbol}</Heading>
        {loading ? <Skeleton height="20px" w="140px"/> :
        <HStack>
          <Text fontSize="lg" fontWeight="bold">{price!=null ? price.toFixed(2) : "—"}</Text>
          <Badge>{currency||"—"}</Badge>
        </HStack>}
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <path d={path} fill="none" stroke="#7dd3fc" strokeWidth="1.5"/>
        </svg>
      </VStack>
    </Box>
  );
}
