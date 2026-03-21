import { Box, Container } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <Box minH="100vh" bg="bg.surface">
      <Navbar />
      <Container maxW="7xl" px={4} py={6}>
        <Outlet />
      </Container>
    </Box>
  );
}
