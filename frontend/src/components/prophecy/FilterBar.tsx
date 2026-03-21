import { Flex, Button, Input } from "@chakra-ui/react";
import { NativeSelectField, NativeSelectRoot } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import type { ProphecyType, ProphecyStatus } from "../../types";

const BOOK_OPTIONS = [
  { value: "", label: "All Books" },
  { value: "1", label: "AGOT" },
  { value: "2", label: "ACOK" },
  { value: "3", label: "ASOS" },
  { value: "4", label: "AFFC" },
  { value: "5", label: "ADWD" },
];

const TYPE_OPTIONS: { value: ProphecyType | ""; label: string }[] = [
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

const STATUS_OPTIONS: { value: ProphecyStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "partially_fulfilled", label: "Partially Fulfilled" },
  { value: "unfulfilled", label: "Unfulfilled" },
  { value: "debated", label: "Debated" },
  { value: "subverted", label: "Subverted" },
];

function setParam(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
  params.delete("offset");
  return params;
}

export default function FilterBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [characterInput, setCharacterInput] = useState(searchParams.get("character") ?? "");
  const debouncedCharacter = useDebounce(characterInput, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    setParam(params, "character", debouncedCharacter);
    setSearchParams(params, { replace: true });
  }, [debouncedCharacter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    setParam(params, key, value);
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setCharacterInput("");
    setSearchParams({}, { replace: true });
  };

  const hasFilters = searchParams.toString() !== "";

  return (
    <Flex gap={3} wrap="wrap" align="end">
      <NativeSelectRoot size="sm" w="auto" minW="120px">
        <NativeSelectField
          value={searchParams.get("book") ?? ""}
          onChange={(e) => handleSelect("book", e.target.value)}
        >
          {BOOK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>

      <NativeSelectRoot size="sm" w="auto" minW="160px">
        <NativeSelectField
          value={searchParams.get("type") ?? ""}
          onChange={(e) => handleSelect("type", e.target.value)}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>

      <NativeSelectRoot size="sm" w="auto" minW="140px">
        <NativeSelectField
          value={searchParams.get("status") ?? ""}
          onChange={(e) => handleSelect("status", e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </NativeSelectField>
      </NativeSelectRoot>

      <Input
        placeholder="Source character..."
        value={characterInput}
        onChange={(e) => setCharacterInput(e.target.value)}
        size="sm"
        maxW="180px"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear Filters
        </Button>
      )}
    </Flex>
  );
}
