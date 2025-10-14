import { Box, HStack, Heading, Text, Badge, VStack, Skeleton, Tooltip } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { quotes, spark } from "../api";
import { useNavigate } from "react-router-dom";

export default function TickerCard({ symbol }:{ symbol: string }) {
  const [price, setPrice] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string>("");
  const [trend, setTrend] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const q = await quotes([symbol]);
      const d = q[symbol];
      setPrice(d?.price ?? null);
      setCurrency(d?.currency ?? "");
      const sp = await spark(symbol);
      setTrend(sp.closes ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [symbol]);

  const w = 120, h = 40;
  const min = trend.length ? Math.min(...trend) : 0;
  const max = trend.length ? Math.max(...trend) : 1;
  const path = trend.map((v,i)=>{
    const x = (i/Math.max(trend.length-1,1))*w;
    const y = h - ((v-min)/Math.max(max-min,1))*h;
    return `${i===0?'M':'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  return (
    <Box
      bg="#0f152a"
      border="1px solid #26314b"
      p={4}
      rounded="2xl"
      shadow="md"
      minW="260px"
      _hover={{ borderColor: "#3b4a72", transform: "translateY(-2px)" }}
      transition="all 0.15s ease"
      cursor="pointer"
      onClick={() => nav(`/analytics?s=${encodeURIComponent(symbol)}`)}
    >
      <VStack align="start" spacing={2}>
        <Heading size="sm" color="gray.100">{symbol}</Heading>
        {loading ? <Skeleton height="20px" w="160px"/> :
        <HStack>
          <Tooltip label="Last price"><Text fontSize="lg" fontWeight="bold" color="white">{price!=null ? price.toFixed(2) : "—"}</Text></Tooltip>
          <Badge colorScheme="purple">{currency||"—"}</Badge>
        </HStack>}
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <path d={path} fill="none" stroke="#7dd3fc" strokeWidth="1.8"/>
        </svg>
      </VStack>
    </Box>
  );
}
