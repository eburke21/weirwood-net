import {
  Heading, Text, VStack, Flex, Button, Box, Badge, Textarea, HStack,
  Skeleton,
} from "@chakra-ui/react";
import { Alert } from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useEvents } from "../api/events";
import { useSSE } from "../hooks/useSSE";
import ThinkingIndicator from "../components/shared/ThinkingIndicator";
import ConfidenceBadge from "../components/shared/ConfidenceBadge";

const FULFILLMENT_COLORS: Record<string, string> = {
  literal: "green",
  metaphorical: "purple",
  subverted: "red",
  partial: "yellow",
};

interface MatchData {
  prophecy_id: number;
  prophecy_title: string;
  match_confidence: number;
  fulfillment_type: string;
  reasoning: string;
  remaining_unfulfilled: string;
}

function MatchCard({ match }: { match: MatchData }) {
  return (
    <Box bg="bg.card" borderWidth="1px" borderColor="border" rounded="lg" p={4}>
      <Flex justify="space-between" align="start" mb={2}>
        <Box
          as={Link}
          to={`/prophecy/${match.prophecy_id}`}
          fontWeight="medium"
          color="accent"
          _hover={{ textDecoration: "underline" }}
        >
          {match.prophecy_title}
        </Box>
        <HStack gap={2}>
          <Badge
            colorPalette={FULFILLMENT_COLORS[match.fulfillment_type] ?? "gray"}
            variant="subtle"
            size="sm"
          >
            {match.fulfillment_type}
          </Badge>
          <ConfidenceBadge confidence={match.match_confidence} />
        </HStack>
      </Flex>
      <Text fontSize="sm" mb={2}>{match.reasoning}</Text>
      {match.remaining_unfulfilled && (
        <Text fontSize="xs" color="text.secondary" fontStyle="italic">
          Still open: {match.remaining_unfulfilled}
        </Text>
      )}
    </Box>
  );
}

export default function FulfillmentAnalyzer() {
  const [eventText, setEventText] = useState("");
  const { data: events, isLoading: eventsLoading } = useEvents();

  const sseBody = useMemo(() => ({ event_description: eventText }), [eventText]);
  const sseOptions = useMemo(() => ({
    endpoint: "/api/v1/analyze/fulfillment",
    method: "POST" as const,
    body: sseBody,
  }), [sseBody]);

  const { events: sseEvents, isStreaming, isComplete, error, start, reset } = useSSE(sseOptions);

  const statusMessage = sseEvents.find((e) => e.event === "status")?.data?.message as string | undefined;
  const matchEvents = sseEvents.filter((e) => e.event === "match");
  const completeEvent = sseEvents.find((e) => e.event === "complete");

  const handleAnalyze = () => {
    if (!eventText.trim()) return;
    start();
  };

  const handleEventChip = (description: string) => {
    setEventText(description);
    reset();
  };

  return (
    <VStack align="stretch" gap={6}>
      <Box>
        <Heading size="2xl" mb={1}>Fulfillment Analyzer</Heading>
        <Text color="text.secondary">
          Describe an event and discover which prophecies it might fulfill.
        </Text>
      </Box>

      {/* Event input */}
      <Box>
        <Textarea
          placeholder="Describe an event, real or hypothetical..."
          value={eventText}
          onChange={(e) => setEventText(e.target.value)}
          rows={3}
          mb={3}
        />
        <Button
          onClick={handleAnalyze}
          disabled={!eventText.trim() || isStreaming}
          loading={isStreaming}
          colorPalette="red"
          size="md"
        >
          Analyze
        </Button>
      </Box>

      {/* Pre-seeded event chips */}
      <Box>
        <Text fontSize="sm" color="text.secondary" mb={2}>Or choose a canonical event:</Text>
        {eventsLoading ? (
          <Skeleton height="40px" />
        ) : (
          <Flex gap={2} wrap="wrap">
            {events?.map((evt) => (
              <Badge
                key={evt.id}
                variant="outline"
                cursor="pointer"
                onClick={() => handleEventChip(evt.description)}
                _hover={{ bg: "bg.card" }}
                py={1}
                px={2}
              >
                {evt.title}
              </Badge>
            ))}
          </Flex>
        )}
      </Box>

      {/* Thinking state — waiting for first match */}
      {isStreaming && matchEvents.length === 0 && (
        <ThinkingIndicator
          label={statusMessage ?? "Cross-referencing prophecies..."}
        />
      )}

      {/* Error */}
      {error && (
        <Alert.Root status="error">
          <Alert.Title>Analysis failed</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      )}

      {/* Match results */}
      {matchEvents.length > 0 && (
        <VStack align="stretch" gap={3}>
          <Heading size="md">
            Matches {isComplete && `(${(completeEvent?.data as { total_matches?: number })?.total_matches ?? matchEvents.length})`}
          </Heading>
          {matchEvents
            .sort((a, b) => ((b.data as MatchData).match_confidence ?? 0) - ((a.data as MatchData).match_confidence ?? 0))
            .map((evt, i) => (
              <MatchCard key={i} match={evt.data as MatchData} />
            ))}
        </VStack>
      )}

      {/* Completion */}
      {isComplete && matchEvents.length === 0 && (
        <Text color="text.secondary">No prophecies match this event.</Text>
      )}
    </VStack>
  );
}
