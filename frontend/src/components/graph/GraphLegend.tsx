import { Box, Flex, Text, HStack } from "@chakra-ui/react";
import type { ProphecyType, ConnectionType } from "../../types";
import { nodeColorScale, edgeColorScale } from "./scales";

const PROPHECY_TYPES: { type: ProphecyType; label: string }[] = [
  { type: "verbal_prophecy", label: "Verbal" },
  { type: "dream_vision", label: "Dream" },
  { type: "flame_vision", label: "Flames" },
  { type: "song", label: "Song" },
  { type: "house_words", label: "House Words" },
  { type: "physical_sign", label: "Omen" },
  { type: "greendream", label: "Greendream" },
  { type: "house_of_undying", label: "Undying" },
  { type: "other", label: "Other" },
];

const CONNECTION_TYPES: { type: ConnectionType; label: string }[] = [
  { type: "thematic_parallel", label: "Parallel" },
  { type: "shared_fulfillment", label: "Shared" },
  { type: "contradiction", label: "Contradiction" },
  { type: "sequential", label: "Sequential" },
  { type: "reinterpretation", label: "Reinterpretation" },
];

export default function GraphLegend() {
  return (
    <Box bg="bg.card" p={3} rounded="md" borderWidth="1px" borderColor="border" fontSize="xs">
      <Text fontWeight="bold" mb={2}>Legend</Text>

      <Text color="text.secondary" mb={1}>Node Color = Prophecy Type</Text>
      <Flex gap={3} wrap="wrap" mb={3}>
        {PROPHECY_TYPES.map(({ type, label }) => (
          <HStack key={type} gap={1}>
            <Box w="10px" h="10px" rounded="full" bg={nodeColorScale(type)} />
            <Text>{label}</Text>
          </HStack>
        ))}
      </Flex>

      <Text color="text.secondary" mb={1}>Edge Color = Connection Type</Text>
      <Flex gap={3} wrap="wrap" mb={2}>
        {CONNECTION_TYPES.map(({ type, label }) => (
          <HStack key={type} gap={1}>
            <Box w="16px" h="2px" bg={edgeColorScale(type)} />
            <Text>{label}</Text>
          </HStack>
        ))}
      </Flex>

      <Text color="text.secondary">Larger nodes = more connections. Dashed edges = contradictions.</Text>
    </Box>
  );
}
