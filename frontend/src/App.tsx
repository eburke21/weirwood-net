import { Routes, Route } from "react-router-dom";
import { Container, Heading, Text, VStack } from "@chakra-ui/react";

function HomePage() {
  return (
    <Container maxW="container.xl" py={16}>
      <VStack gap={4}>
        <Heading as="h1" size="4xl">
          Weirwood.net
        </Heading>
        <Text fontSize="xl" color="fg.muted">
          ASOIAF Prophecy Tracker & Connection Engine
        </Text>
      </VStack>
    </Container>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}

export default App;
