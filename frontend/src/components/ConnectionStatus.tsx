import { useEffect, useState } from "react";
import { Box } from "@chakra-ui/react";
import axios from "axios";

export default function ConnectionStatus() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const ping = async () => {
      try {
        await axios.get("/api/state", { timeout: 2000 });
        if (mounted) setOk(true);
      } catch {
        if (mounted) setOk(false);
      }
    };
    ping();
    const id = setInterval(ping, 8000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const color = ok === null ? "gray.400" : ok ? "green.400" : "red.400";
  const label = ok === null ? "checking…" : ok ? "online" : "offline";

  return (
    <Box as="span" display="inline-flex" alignItems="center" gap="8px" color="gray.300">
      <Box w="10px" h="10px" rounded="full" bg={color} />
      <span style={{fontSize: 12}}>{label}</span>
    </Box>
  );
}
