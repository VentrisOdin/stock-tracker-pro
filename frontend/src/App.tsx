
import { Box, Container, HStack, Heading, Link, Spacer } from "@chakra-ui/react";
import { Routes, Route, Link as RLink, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Portfolio from "./pages/Portfolio";
import Transactions from "./pages/Transactions";

function Nav() {
  const tabs = [
    { to: "/", label: "Dashboard" },
    { to: "/analytics", label: "Analytics" },
    { to: "/portfolio", label: "Portfolio" },
    { to: "/transactions", label: "Transactions" },
  ];
  const loc = useLocation();
  return (
    <Box bg="#0e1220" borderBottom="1px solid #1f2433" py={3}>
      <Container maxW="6xl">
        <HStack>
          <Heading size="md">Balanced Global Tracker</Heading>
          <Spacer/>
          <HStack spacing={6}>
            {tabs.map(t => (
              <Link as={RLink} key={t.to} to={t.to} fontWeight={loc.pathname===t.to?"bold":"normal"}>
                {t.label}
              </Link>
            ))}
          </HStack>
        </HStack>
      </Container>
    </Box>
  );
}

export default function App() {
  return (
    <Box>
      <Nav />
      <Container maxW="6xl" py={6}>
        <Routes>
          <Route path="/" element={<Dashboard/>} />
          <Route path="/analytics" element={<Analytics/>} />
          <Route path="/portfolio" element={<Portfolio/>} />
          <Route path="/transactions" element={<Transactions/>} />
        </Routes>
      </Container>
    </Box>
  );
}
