import { Box, Flex, HStack, Heading, IconButton, VStack } from "@chakra-ui/react";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerRoot,
  DrawerTrigger,
} from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Dashboard", to: "/" },
  { label: "Explore", to: "/explore" },
  { label: "Analyzer", to: "/analyze" },
  { label: "Predictions", to: "/predict" },
  { label: "About", to: "/about" },
];

function NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Box
      as={Link}
      to={to}
      px={3}
      py={2}
      rounded="md"
      fontWeight={active ? "bold" : "normal"}
      color={active ? "accent" : "text.secondary"}
      _hover={{ color: "accent", bg: "bg.card" }}
      transition="all 0.15s"
    >
      {label}
    </Box>
  );
}

export default function Navbar() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  return (
    <Box as="nav" bg="bg.card" borderBottomWidth="1px" borderColor="border" position="sticky" top={0} zIndex={10}>
      <Flex maxW="7xl" mx="auto" px={4} h="16" align="center" justify="space-between">
        <Heading as={Link} to="/" size="lg" color="accent" fontWeight="bold" _hover={{ textDecoration: "none" }}>
          Weirwood.net
        </Heading>

        {/* Desktop nav */}
        <HStack gap={1} display={{ base: "none", md: "flex" }}>
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} {...link} active={isActive(link.to)} />
          ))}
        </HStack>

        {/* Mobile hamburger */}
        <DrawerRoot open={drawerOpen} onOpenChange={(e) => setDrawerOpen(e.open)} placement="end">
          <DrawerBackdrop />
          <DrawerTrigger asChild>
            <IconButton
              aria-label="Open menu"
              display={{ base: "flex", md: "none" }}
              variant="ghost"
              size="sm"
            >
              ☰
            </IconButton>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerCloseTrigger />
            <DrawerBody pt={10}>
              <VStack align="stretch" gap={2}>
                {NAV_LINKS.map((link) => (
                  <Box
                    key={link.to}
                    as={Link}
                    to={link.to}
                    onClick={() => setDrawerOpen(false)}
                    py={3}
                    px={4}
                    rounded="md"
                    fontWeight={isActive(link.to) ? "bold" : "normal"}
                    color={isActive(link.to) ? "accent" : "text.secondary"}
                    _hover={{ bg: "bg.card" }}
                  >
                    {link.label}
                  </Box>
                ))}
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </DrawerRoot>
      </Flex>
    </Box>
  );
}
