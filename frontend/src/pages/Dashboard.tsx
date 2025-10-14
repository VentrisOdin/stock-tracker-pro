
import { SimpleGrid, Heading, VStack, Button, HStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getState } from "../api";
import TickerCard from "../components/TickerCard";
import { Link as RLink } from "react-router-dom";

export default function Dashboard(){
  const [watch, setWatch] = useState<string[]>([]);
  const load = async ()=>{
    const s = await getState();
    setWatch(s.watchlist || []);
  };
  useEffect(()=>{ load(); }, []);

  return (
    <VStack align="start" spacing={4}>
      <HStack w="100%" justify="space-between">
        <Heading size="lg">Live Dashboard</Heading>
        <Button as={RLink} to="/analytics" variant="outline">Open Analytics</Button>
      </HStack>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} w="100%">
        {watch.map(sym => <TickerCard key={sym} symbol={sym} />)}
      </SimpleGrid>
    </VStack>
  );
}
