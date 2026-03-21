import {
  Box, Heading, Text, VStack, HStack, Flex, Badge, Button, Skeleton,
  Separator,
} from "@chakra-ui/react";
import { Alert } from "@chakra-ui/react";
import { useParams, Link } from "react-router-dom";
import { useProphecy } from "../api/prophecies";
import StatusBadge from "../components/shared/StatusBadge";
import BookBadge from "../components/shared/BookBadge";
import TypeIcon from "../components/shared/TypeIcon";

function DetailSkeleton() {
  return (
    <VStack align="stretch" gap={4}>
      <Skeleton height="40px" maxW="400px" />
      <Skeleton height="20px" maxW="200px" />
      <Skeleton height="120px" />
      <Skeleton height="60px" />
    </VStack>
  );
}

function NotFound() {
  return (
    <VStack py={16} gap={4}>
      <Heading size="xl">Prophecy Not Found</Heading>
      <Text color="text.secondary">The prophecy you're looking for doesn't exist.</Text>
      <Button as={Link} to="/" variant="outline">Back to Dashboard</Button>
    </VStack>
  );
}

export default function ProphecyDetail() {
  const { id } = useParams<{ id: string }>();
  const prophecyId = Number(id);
  const { data: prophecy, isLoading, isError } = useProphecy(prophecyId);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !prophecy) return <NotFound />;

  return (
    <VStack align="stretch" gap={6}>
      {/* Back link */}
      <Box>
        <Button as={Link} to="/" variant="ghost" size="sm">
          ← Back to Dashboard
        </Button>
      </Box>

      {/* Header */}
      <Box>
        <Flex align="center" gap={3} mb={2}>
          <TypeIcon type={prophecy.prophecy_type} />
          <StatusBadge status={prophecy.status} />
          <BookBadge book={prophecy.source_book} />
        </Flex>
        <Heading size="2xl" mb={1}>{prophecy.title}</Heading>
        <Text fontSize="sm" color="text.secondary">
          {prophecy.source_character} — {prophecy.source_chapter}
        </Text>
      </Box>

      <Separator />

      {/* Description */}
      <Box>
        <Heading size="md" mb={2}>Prophecy</Heading>
        <Text fontFamily="prophecy" fontSize="sm" lineHeight="tall" bg="bg.card" p={4} rounded="md" borderWidth="1px" borderColor="border">
          {prophecy.description}
        </Text>
      </Box>

      {/* Notes */}
      {prophecy.notes && (
        <Box bg="bg.card" p={4} rounded="md" borderWidth="1px" borderColor="border" borderLeftWidth="4px" borderLeftColor="accent">
          <Heading size="sm" mb={1}>Notes</Heading>
          <Text fontSize="sm" color="text.secondary">{prophecy.notes}</Text>
        </Box>
      )}

      {/* Fulfillment evidence */}
      {prophecy.fulfillment_evidence && (
        <Box>
          <Heading size="sm" mb={2}>Fulfillment Evidence</Heading>
          <Text fontSize="sm">{prophecy.fulfillment_evidence}</Text>
        </Box>
      )}

      {/* Subject characters & keywords */}
      <Flex gap={6} wrap="wrap">
        {prophecy.subject_characters.length > 0 && (
          <Box>
            <Heading size="sm" mb={2}>Characters</Heading>
            <HStack gap={2} wrap="wrap">
              {prophecy.subject_characters.map((c) => (
                <Badge key={c} variant="outline" size="sm">{c}</Badge>
              ))}
            </HStack>
          </Box>
        )}
        {prophecy.keywords.length > 0 && (
          <Box>
            <Heading size="sm" mb={2}>Keywords</Heading>
            <HStack gap={2} wrap="wrap">
              {prophecy.keywords.map((k) => (
                <Badge key={k} colorPalette="gray" variant="subtle" size="sm">{k}</Badge>
              ))}
            </HStack>
          </Box>
        )}
      </Flex>

      <Separator />

      {/* Connections placeholder */}
      <Box>
        <Heading size="md" mb={2}>Connections</Heading>
        {prophecy.connections.length === 0 ? (
          <Box bg="bg.card" p={6} rounded="md" borderWidth="1px" borderColor="border" textAlign="center">
            <Text color="text.secondary" mb={3}>
              No connections analyzed yet. Click "Find Connections" to discover links to other prophecies.
            </Text>
            <Button disabled variant="outline" size="sm">Find Connections</Button>
          </Box>
        ) : (
          <VStack align="stretch" gap={2}>
            {prophecy.connections.map((conn) => (
              <Box key={conn.id} bg="bg.card" p={3} rounded="md" borderWidth="1px" borderColor="border">
                <Text fontWeight="medium">{conn.connected_prophecy?.title}</Text>
                <Text fontSize="sm" color="text.secondary">{conn.evidence}</Text>
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      {/* Actions placeholder */}
      <Flex gap={3}>
        <Button disabled variant="outline" size="sm">Predict TWOW</Button>
        <Button disabled variant="ghost" size="sm">Export</Button>
      </Flex>
    </VStack>
  );
}
