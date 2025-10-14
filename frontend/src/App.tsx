import { Box, Container, HStack, Heading, Link, Spacer } from "@chakra-ui/react";
import { Routes, Route, Link as RLink, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Portfolio from "./pages/Portfolio";
import Transactions from "./pages/Transactions";
import ConnectionStatus from "./components/ConnectionStatus"; // <- IMPORTANT import

function Nav() {
  const tabs = [
    { to: "/", label: "Dashboard" },
    { to: "/analytics", label: "Analytics" },
    { to: "/portfolio", label: "Portfolio" },
    { to: "/transactions", label: "Transactions" },
  ];
  const loc = useLocation();
  return (
    <Box bg="#0e1220" borderBottom="1px solid #1f2433" py={3} position="sticky" top={0} zIndex={10}>
      <Container maxW="6xl">
        <HStack>
          <Heading size="md" color="gray.100">Balanced Global Tracker</Heading>
          <Spacer />
          <ConnectionStatus />
          <HStack spacing={6} pl={6}>
            {tabs.map(t => (
              <Link
                as={RLink}
                key={t.to}
                to={t.to}
                color={loc.pathname === t.to ? "white" : "gray.300"}
                _hover={{ color: "white" }}
                fontWeight={loc.pathname === t.to ? "bold" : "normal"}
              >
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
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/transactions" element={<Transactions />} />
        </Routes>
      </Container>
    </Box>
  );
}
