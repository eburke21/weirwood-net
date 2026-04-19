import { Box, HStack, Text } from "@chakra-ui/react";

interface ThinkingIndicatorProps {
  label?: string;
}

export default function ThinkingIndicator({ label }: ThinkingIndicatorProps) {
  return (
    <Box
      bg="bg.card"
      borderWidth="1px"
      borderColor="border"
      rounded="md"
      p={4}
      role="status"
      aria-live="polite"
      aria-label={label ? `Thinking: ${label}` : "Thinking"}
    >
      <HStack gap={3} align="center">
        <HStack gap={1.5} aria-hidden="true">
          {[0, 150, 300].map((delay) => (
            <Box
              key={delay}
              w="8px"
              h="8px"
              rounded="full"
              bg="accent"
              css={{
                animation: `thinking-pulse 1.2s ease-in-out infinite`,
                animationDelay: `${delay}ms`,
                "@keyframes thinking-pulse": {
                  "0%, 80%, 100%": { transform: "translateY(0)", opacity: 0.3 },
                  "40%": { transform: "translateY(-4px)", opacity: 1 },
                },
              }}
            />
          ))}
        </HStack>
        {label && (
          <Text fontSize="sm" color="text.secondary" fontFamily="prophecy">
            {label}
          </Text>
        )}
      </HStack>
    </Box>
  );
}
