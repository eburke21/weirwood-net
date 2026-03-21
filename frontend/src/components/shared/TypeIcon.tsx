import { HStack, Text } from "@chakra-ui/react";
import type { ProphecyType } from "../../types";

const TYPE_CONFIG: Record<ProphecyType, { icon: string; label: string }> = {
  verbal_prophecy: { icon: "🗣️", label: "Verbal" },
  dream_vision: { icon: "💭", label: "Dream" },
  flame_vision: { icon: "🔥", label: "Flames" },
  song: { icon: "🎵", label: "Song" },
  house_words: { icon: "🏰", label: "House Words" },
  physical_sign: { icon: "☄️", label: "Omen" },
  greendream: { icon: "🌿", label: "Greendream" },
  house_of_undying: { icon: "🏚️", label: "Undying" },
  other: { icon: "📜", label: "Other" },
};

export default function TypeIcon({ type, showLabel = true }: { type: ProphecyType; showLabel?: boolean }) {
  const config = TYPE_CONFIG[type];
  return (
    <HStack gap={1}>
      <Text as="span" fontSize="sm">{config.icon}</Text>
      {showLabel && <Text as="span" fontSize="xs" color="text.secondary">{config.label}</Text>}
    </HStack>
  );
}
