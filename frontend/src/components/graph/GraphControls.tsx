import { Flex, Button, Text, Box, Input } from "@chakra-ui/react";
import { NativeSelectField, NativeSelectRoot } from "@chakra-ui/react";
import type { GraphFilters } from "../../api/graph";

const BOOK_OPTIONS = [
  { value: "", label: "All Books" },
  { value: "1", label: "AGOT" },
  { value: "2", label: "ACOK" },
  { value: "3", label: "ASOS" },
  { value: "4", label: "AFFC" },
  { value: "5", label: "ADWD" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "verbal_prophecy", label: "Verbal Prophecy" },
  { value: "dream_vision", label: "Dream Vision" },
  { value: "flame_vision", label: "Flame Vision" },
  { value: "song", label: "Song" },
  { value: "house_words", label: "House Words" },
  { value: "physical_sign", label: "Physical Sign" },
  { value: "greendream", label: "Greendream" },
  { value: "house_of_undying", label: "House of the Undying" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "partially_fulfilled", label: "Partially Fulfilled" },
  { value: "unfulfilled", label: "Unfulfilled" },
  { value: "debated", label: "Debated" },
  { value: "subverted", label: "Subverted" },
];

interface Props {
  filters: GraphFilters;
  onChange: (filters: GraphFilters) => void;
}

export default function GraphControls({ filters, onChange }: Props) {
  const update = (key: keyof GraphFilters, value: string | number | undefined) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  return (
    <Flex gap={3} wrap="wrap" align="end">
      <NativeSelectRoot size="sm" w="auto" minW="120px">
        <NativeSelectField
          value={filters.book ?? ""}
          onChange={(e) => update("book", e.target.value ? Number(e.target.value) : undefined)}
        >
          {BOOK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>

      <NativeSelectRoot size="sm" w="auto" minW="140px">
        <NativeSelectField
          value={filters.type ?? ""}
          onChange={(e) => update("type", e.target.value || undefined)}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>

      <NativeSelectRoot size="sm" w="auto" minW="130px">
        <NativeSelectField
          value={filters.status ?? ""}
          onChange={(e) => update("status", e.target.value || undefined)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>

      <Box>
        <Text fontSize="xs" color="text.secondary" mb={1}>Min confidence</Text>
        <Input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={filters.min_confidence ?? 0}
          onChange={(e) => update("min_confidence", Number(e.target.value))}
          size="sm"
          w="120px"
        />
      </Box>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange({})}
      >
        Reset
      </Button>
    </Flex>
  );
}
