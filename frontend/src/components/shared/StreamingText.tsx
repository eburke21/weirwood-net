import { Box, Text } from "@chakra-ui/react";

export default function StreamingText({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  return (
    <Box bg="bg.card" p={4} rounded="md" borderWidth="1px" borderColor="border">
      <Text fontFamily="prophecy" fontSize="sm" lineHeight="tall">
        {text}
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
      </Text>
    </Box>
  );
}
