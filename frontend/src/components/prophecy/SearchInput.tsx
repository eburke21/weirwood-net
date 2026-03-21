import { Input, Box, IconButton, Flex } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "../../hooks/useDebounce";

export default function SearchInput() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") ?? "");
  const debounced = useDebounce(value, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debounced) {
      params.set("search", debounced);
    } else {
      params.delete("search");
    }
    params.delete("offset");
    setSearchParams(params, { replace: true });
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Flex gap={2} maxW="md">
      <Input
        placeholder="Search prophecies, characters, keywords..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        size="md"
      />
      {value && (
        <IconButton
          aria-label="Clear search"
          variant="ghost"
          size="md"
          onClick={() => setValue("")}
        >
          ✕
        </IconButton>
      )}
    </Flex>
  );
}
