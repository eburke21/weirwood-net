import {
  Heading, Text, VStack, Flex, Button, Box,
} from "@chakra-ui/react";
import { NativeSelectField, NativeSelectRoot } from "@chakra-ui/react";
import { Alert } from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { useProphecies } from "../api/prophecies";
import { useSSE } from "../hooks/useSSE";
import ThinkingIndicator from "../components/shared/ThinkingIndicator";
import { API_BASE } from "../config";

type Mode = "single" | "global";

export default function TWOWPredictions() {
  const [mode, setMode] = useState<Mode>("single");
  const [selectedProphecyId, setSelectedProphecyId] = useState<number>(0);
  const { data: propheciesData } = useProphecies({ limit: 200, status: "unfulfilled" as const });

  // Single prediction SSE
  const singleOptions = useMemo(() => ({
    endpoint: `/api/v1/predict/prophecy/${selectedProphecyId}`,
    method: "POST" as const,
  }), [selectedProphecyId]);
  const single = useSSE(singleOptions);

  // Global prediction SSE
  const globalOptions = useMemo(() => ({
    endpoint: "/api/v1/predict/global",
    method: "POST" as const,
  }), []);
  const global = useSSE(globalOptions);

  const active = mode === "single" ? single : global;

  // Accumulate text from chunk events
  const accumulatedText = active.events
    .filter((e) => e.event === "chunk")
    .map((e) => (e.data as { text: string }).text)
    .join("");

  const statusMessage = active.events.find((e) => e.event === "status")?.data?.message as string | undefined;

  const handlePredict = () => {
    if (mode === "single" && selectedProphecyId > 0) {
      single.start();
    } else if (mode === "global") {
      global.start();
    }
  };

  const handleExport = () => {
    if (mode === "single" && selectedProphecyId > 0) {
      window.open(`${API_BASE}/api/v1/export/prophecy/${selectedProphecyId}`, "_blank");
    } else if (accumulatedText) {
      const blob = new Blob([`# TWOW Global Predictions Report\n\n${accumulatedText}`], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "TWOW_Predictions_Report.md";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <VStack align="stretch" gap={6}>
      <Box>
        <Heading size="2xl" mb={1}>TWOW Predictions</Heading>
        <Text color="text.secondary">
          AI-generated predictions for how prophecies might be fulfilled in The Winds of Winter.
        </Text>
      </Box>

      {/* Mode toggle */}
      <Flex gap={2}>
        <Button
          size="sm"
          variant={mode === "single" ? "solid" : "ghost"}
          onClick={() => { setMode("single"); global.reset(); }}
        >
          Per-Prophecy
        </Button>
        <Button
          size="sm"
          variant={mode === "global" ? "solid" : "ghost"}
          onClick={() => { setMode("global"); single.reset(); }}
        >
          Global Report
        </Button>
      </Flex>

      {/* Single mode: prophecy selector */}
      {mode === "single" && (
        <Flex gap={3} align="end">
          <NativeSelectRoot size="md" flex={1} maxW="400px">
            <NativeSelectField
              value={selectedProphecyId}
              onChange={(e) => setSelectedProphecyId(Number(e.target.value))}
            >
              <option value={0}>Select a prophecy...</option>
              {propheciesData?.items.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
          <Button
            onClick={handlePredict}
            disabled={selectedProphecyId === 0 || active.isStreaming}
            loading={active.isStreaming}
            colorPalette="red"
          >
            Predict
          </Button>
        </Flex>
      )}

      {/* Global mode: generate button */}
      {mode === "global" && (
        <Box>
          <Text fontSize="sm" color="text.secondary" mb={2}>
            Generates a comprehensive analysis of all unfulfilled prophecies. This may take 30-60 seconds.
          </Text>
          <Button
            onClick={handlePredict}
            disabled={active.isStreaming}
            loading={active.isStreaming}
            colorPalette="red"
          >
            Generate Full Report
          </Button>
        </Box>
      )}

      {/* Thinking state — waiting for first chunk */}
      {active.isStreaming && !accumulatedText && (
        <ThinkingIndicator
          label={
            statusMessage ??
            (mode === "global"
              ? "Weaving the global prophecy report..."
              : "Consulting the three-eyed raven...")
          }
        />
      )}

      {/* Error */}
      {active.error && (
        <Alert.Root status="error">
          <Alert.Title>Prediction failed</Alert.Title>
          <Alert.Description>{active.error}</Alert.Description>
        </Alert.Root>
      )}

      {/* Streaming / completed text */}
      {accumulatedText && (
        <Box>
          <Flex justify="space-between" align="center" mb={2}>
            <Heading size="md">
              {mode === "single" ? "Prediction" : "Global Report"}
            </Heading>
            {active.isComplete && (
              <Button size="sm" variant="outline" onClick={handleExport}>
                Export Markdown
              </Button>
            )}
          </Flex>
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
            {active.isStreaming && (
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
        </Box>
      )}
    </VStack>
  );
}
