import { Box, Container } from "@chakra-ui/react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "./Navbar";

export default function Layout() {
  const location = useLocation();

  return (
    <Box minH="100vh" bg="bg.surface">
      <Navbar />
      <Container maxW="7xl" px={4} py={6}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Outlet />
        </motion.div>
      </Container>
    </Box>
  );
}
