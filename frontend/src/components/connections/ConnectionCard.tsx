import { Box, Badge, Text, Flex, HStack } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ConfidenceBadge from "../shared/ConfidenceBadge";
import type { ConnectionType } from "../../types";

const TYPE_COLORS: Record<ConnectionType, string> = {
  thematic_parallel: "purple",
  shared_fulfillment: "blue",
  contradiction: "red",
  sequential: "green",
  reinterpretation: "orange",
};

const TYPE_LABELS: Record<ConnectionType, string> = {
  thematic_parallel: "Thematic Parallel",
  shared_fulfillment: "Shared Fulfillment",
  contradiction: "Contradiction",
  sequential: "Sequential",
  reinterpretation: "Reinterpretation",
};

interface ConnectionData {
  connected_to_id: number;
  connected_prophecy_title: string;
  connected_prophecy_status: string | null;
  connection_type: ConnectionType;
  confidence: number;
  evidence: string;
  implication: string;
}

export default function ConnectionCard({ connection }: { connection: ConnectionData }) {
  const color = TYPE_COLORS[connection.connection_type] ?? "gray";
  const label = TYPE_LABELS[connection.connection_type] ?? connection.connection_type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
    <Box
      bg="bg.card"
      borderWidth="1px"
      borderColor="border"
      rounded="lg"
      p={4}
    >
      <HStack gap={2} mb={3}>
        <Badge colorPalette={color} variant="subtle">{label}</Badge>
        <ConfidenceBadge confidence={connection.confidence} />
      </HStack>

      <Text fontSize="sm" mb={2}>{connection.evidence}</Text>

      <Text fontSize="sm" fontStyle="italic" color="text.secondary" mb={3}>
        {connection.implication}
      </Text>

      <Flex align="center" gap={2}>
        <Text fontSize="xs" color="text.secondary">Linked to:</Text>
        <Box
          as={Link}
          to={`/prophecy/${connection.connected_to_id}`}
          fontSize="sm"
          fontWeight="medium"
          color="accent"
          _hover={{ textDecoration: "underline" }}
        >
          {connection.connected_prophecy_title}
        </Box>
      </Flex>
    </Box>
    </motion.div>
  );
}
