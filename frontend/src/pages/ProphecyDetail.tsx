import {
  Box, Heading, Text, VStack, HStack, Flex, Badge, Button, Skeleton,
  Separator, Spinner,
} from "@chakra-ui/react";
import { Alert } from "@chakra-ui/react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useProphecy } from "../api/prophecies";
import { fetchApi } from "../api/client";
import { useSSE } from "../hooks/useSSE";
import StatusBadge from "../components/shared/StatusBadge";
import BookBadge from "../components/shared/BookBadge";
import TypeIcon from "../components/shared/TypeIcon";
import StreamingText from "../components/shared/StreamingText";
import ConnectionCard from "../components/connections/ConnectionCard";
import type { ConnectionType } from "../types";

interface CachedConnectionsResponse {
  prophecy_id: number;
  connections: Array<{
    id: number;
    connected_prophecy: { id: number; title: string; status: string } | null;
    connection_type: ConnectionType;
    confidence: number;
    evidence: string;
    implication: string;
    model_version: string;
    generated_at: string | null;
  }>;
  cached: boolean;
}

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

function ConnectionsPanel({ prophecyId }: { prophecyId: number }) {
  const queryClient = useQueryClient();

  const { data: cachedData, isLoading: cacheLoading } = useQuery({
    queryKey: ["connections", prophecyId],
    queryFn: () => fetchApi<CachedConnectionsResponse>(`/api/v1/prophecies/${prophecyId}/connections`),
  });

  const sseOptions = useMemo(() => ({
    endpoint: `/api/v1/prophecies/${prophecyId}/connections/generate`,
    method: "POST" as const,
    body: { force_regenerate: false },
  }), [prophecyId]);

  const { events, isStreaming, isComplete, error: sseError, start, reset } = useSSE(sseOptions);

  const statusMessage = events.find((e) => e.event === "status")?.data?.message as string | undefined;
  const connectionEvents = events.filter((e) => e.event === "connection");
  const completeEvent = events.find((e) => e.event === "complete");

  const handleGenerate = (forceRegenerate: boolean) => {
    reset();
    // Use a fresh SSE with force_regenerate if needed
    if (forceRegenerate) {
      // For regenerate, we need to modify the body
      const controller = new AbortController();
      const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
      fetch(`${API_BASE}/api/v1/prophecies/${prophecyId}/connections/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ force_regenerate: true }),
        signal: controller.signal,
      }).then(async (response) => {
        if (!response.ok || !response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
        }
        // After regeneration, invalidate cache
        queryClient.invalidateQueries({ queryKey: ["connections", prophecyId] });
        queryClient.invalidateQueries({ queryKey: ["prophecy", prophecyId] });
        queryClient.invalidateQueries({ queryKey: ["prophecies"] });
      });
      // Also start the hook for UI feedback
    }
    start();
  };

  // After streaming completes, refetch cached data
  if (isComplete && completeEvent) {
    queryClient.invalidateQueries({ queryKey: ["connections", prophecyId] });
    queryClient.invalidateQueries({ queryKey: ["prophecy", prophecyId] });
    queryClient.invalidateQueries({ queryKey: ["prophecies"] });
  }

  const hasCachedConnections = cachedData?.cached && cachedData.connections.length > 0;
  const showStreamingResults = isStreaming || (connectionEvents.length > 0 && !hasCachedConnections);

  if (cacheLoading) {
    return <Skeleton height="100px" />;
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={3}>
        <Heading size="md">Connections</Heading>
        {hasCachedConnections && !isStreaming && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleGenerate(true)}
          >
            Regenerate
          </Button>
        )}
      </Flex>

      {/* Streaming status */}
      {isStreaming && statusMessage && (
        <StreamingText text={statusMessage} isStreaming={true} />
      )}

      {/* SSE error */}
      {sseError && (
        <Alert.Root status="error" mb={3}>
          <Alert.Title>Connection analysis failed</Alert.Title>
          <Alert.Description>{sseError}</Alert.Description>
        </Alert.Root>
      )}

      {/* Streaming connection cards */}
      {showStreamingResults && connectionEvents.length > 0 && (
        <VStack align="stretch" gap={3} mt={3}>
          {connectionEvents.map((evt, i) => (
            <ConnectionCard
              key={i}
              connection={evt.data as {
                connected_to_id: number;
                connected_prophecy_title: string;
                connected_prophecy_status: string | null;
                connection_type: ConnectionType;
                confidence: number;
                evidence: string;
                implication: string;
              }}
            />
          ))}
        </VStack>
      )}

      {/* Completion message */}
      {isComplete && completeEvent && (
        <Text fontSize="sm" color="text.secondary" mt={2}>
          Found {(completeEvent.data as { total_connections?: number }).total_connections} connections.
          {isStreaming && <Spinner size="xs" ml={2} />}
        </Text>
      )}

      {/* Cached connections (when not streaming) */}
      {hasCachedConnections && !showStreamingResults && (
        <VStack align="stretch" gap={3}>
          {cachedData!.connections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              connection={{
                connected_to_id: conn.connected_prophecy?.id ?? 0,
                connected_prophecy_title: conn.connected_prophecy?.title ?? "Unknown",
                connected_prophecy_status: conn.connected_prophecy?.status ?? null,
                connection_type: conn.connection_type,
                confidence: conn.confidence,
                evidence: conn.evidence,
                implication: conn.implication,
              }}
            />
          ))}
        </VStack>
      )}

      {/* No connections yet */}
      {!hasCachedConnections && !showStreamingResults && !isStreaming && (
        <Box bg="bg.card" p={6} rounded="md" borderWidth="1px" borderColor="border" textAlign="center">
          <Text color="text.secondary" mb={3}>
            No connections analyzed yet. Click "Find Connections" to discover links to other prophecies.
          </Text>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerate(false)}
            loading={isStreaming}
          >
            Find Connections
          </Button>
        </Box>
      )}
    </Box>
  );
}

function PredictionPanel({ prophecyId, prophecyTitle }: { prophecyId: number; prophecyTitle: string }) {
  const sseOptions = useMemo(() => ({
    endpoint: `/api/v1/predict/prophecy/${prophecyId}`,
    method: "POST" as const,
  }), [prophecyId]);

  const { events, isStreaming, isComplete, error, start } = useSSE(sseOptions);

  const statusMessage = events.find((e) => e.event === "status")?.data?.message as string | undefined;
  const accumulatedText = events
    .filter((e) => e.event === "chunk")
    .map((e) => (e.data as { text: string }).text)
    .join("");

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={3}>
        <Heading size="md">TWOW Prediction</Heading>
        {!isStreaming && !accumulatedText && (
          <Button size="sm" variant="outline" onClick={start}>
            Predict TWOW
          </Button>
        )}
      </Flex>

      {isStreaming && statusMessage && !accumulatedText && (
        <StreamingText text={statusMessage} isStreaming={true} />
      )}

      {error && (
        <Alert.Root status="error">
          <Alert.Title>Prediction failed</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      )}

      {accumulatedText && (
        <Box
          bg="bg.card"
          p={4}
          rounded="md"
          borderWidth="1px"
          borderColor="border"
          whiteSpace="pre-wrap"
          fontSize="sm"
          lineHeight="tall"
        >
          {accumulatedText}
          {isStreaming && (
            <Box
              as="span"
              display="inline-block"
              w="2px"
              h="1em"
              bg="accent"
              ml={1}
              verticalAlign="text-bottom"
              animation="blink 1s step-end infinite"
              css={{ "@keyframes blink": { "50%": { opacity: 0 } } }}
            />
          )}
        </Box>
      )}

      {!isStreaming && !accumulatedText && !error && (
        <Box bg="bg.card" p={6} rounded="md" borderWidth="1px" borderColor="border" textAlign="center">
          <Text color="text.secondary">
            Click "Predict TWOW" to generate an AI analysis of how this prophecy might be fulfilled.
          </Text>
        </Box>
      )}
    </Box>
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

      {/* Connections panel */}
      <ConnectionsPanel prophecyId={prophecyId} />

      <Separator />

      {/* TWOW Prediction panel */}
      <PredictionPanel prophecyId={prophecyId} prophecyTitle={prophecy.title} />

      <Separator />

      {/* Export */}
      <Flex gap={3}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
            window.open(`${API_BASE}/api/v1/export/prophecy/${prophecyId}`, "_blank");
          }}
        >
          Export Markdown
        </Button>
      </Flex>
    </VStack>
  );
}
