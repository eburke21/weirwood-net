import { Heading, Text, VStack } from "@chakra-ui/react";

export default function About() {
  return (
    <VStack align="stretch" gap={4}>
      <Heading size="2xl">About Weirwood.net</Heading>
      <Text color="text.secondary">
        A literary analysis engine for A Song of Ice and Fire prophecies.
        Built with FastAPI, React, and Claude AI.
      </Text>
    </VStack>
  );
}
