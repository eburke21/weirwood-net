import { Heading, Text, VStack, Flex, Button, Box, Skeleton, SimpleGrid } from "@chakra-ui/react";
import { Alert } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { useProphecies } from "../api/prophecies";
import SearchInput from "../components/prophecy/SearchInput";
import FilterBar from "../components/prophecy/FilterBar";
import ProphecyCardGrid from "../components/prophecy/ProphecyCardGrid";
import ProphecyTable from "../components/prophecy/ProphecyTable";
import Pagination from "../components/prophecy/Pagination";
import type { ProphecyFilters } from "../types";

const DEFAULT_LIMIT = 12;

function paramsToFilters(params: URLSearchParams): ProphecyFilters {
  const filters: ProphecyFilters = {
    limit: DEFAULT_LIMIT,
  };
  const book = params.get("book");
  if (book) filters.book = Number(book);
  const type = params.get("type");
  if (type) filters.type = type as ProphecyFilters["type"];
  const status = params.get("status");
  if (status) filters.status = status as ProphecyFilters["status"];
  const character = params.get("character");
  if (character) filters.character = character;
  const search = params.get("search");
  if (search) filters.search = search;
  const sortBy = params.get("sort_by");
  if (sortBy) filters.sort_by = sortBy;
  const sortOrder = params.get("sort_order");
  if (sortOrder) filters.sort_order = sortOrder;
  const offset = params.get("offset");
  if (offset) filters.offset = Number(offset);
  return filters;
}

function LoadingSkeleton({ view }: { view: string }) {
  if (view === "table") {
    return (
      <VStack align="stretch" gap={2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} height="40px" />
        ))}
      </VStack>
    );
  }
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} height="180px" rounded="lg" />
      ))}
    </SimpleGrid>
  );
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") ?? "cards";
  const filters = paramsToFilters(searchParams);
  const { data, isLoading, isError, error, refetch } = useProphecies(filters);

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams);
    const currentSort = params.get("sort_by");
    const currentOrder = params.get("sort_order") ?? "asc";
    if (currentSort === field) {
      params.set("sort_order", currentOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sort_by", field);
      params.set("sort_order", "asc");
    }
    params.delete("offset");
    setSearchParams(params, { replace: true });
  };

  const handleViewToggle = (v: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("view", v);
    setSearchParams(params, { replace: true });
  };

  const handlePageChange = (offset: number) => {
    const params = new URLSearchParams(searchParams);
    if (offset > 0) {
      params.set("offset", String(offset));
    } else {
      params.delete("offset");
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <VStack align="stretch" gap={5}>
      <Box>
        <Heading size="2xl" mb={1}>Prophecy Dashboard</Heading>
        <Text color="text.secondary">Browse, filter, and search ASOIAF prophecies.</Text>
      </Box>

      <SearchInput />
      <FilterBar />

      <Flex justify="space-between" align="center">
        <Text fontSize="sm" color="text.secondary">
          {data ? `${data.total} prophecies` : "Loading..."}
        </Text>
        <Flex gap={1}>
          <Button
            size="xs"
            variant={view === "cards" ? "solid" : "ghost"}
            onClick={() => handleViewToggle("cards")}
          >
            ▦ Cards
          </Button>
          <Button
            size="xs"
            variant={view === "table" ? "solid" : "ghost"}
            onClick={() => handleViewToggle("table")}
          >
            ☰ Table
          </Button>
        </Flex>
      </Flex>

      {isLoading && <LoadingSkeleton view={view} />}

      {isError && (
        <Alert.Root status="error">
          <Alert.Title>Failed to load prophecies</Alert.Title>
          <Alert.Description>{error instanceof Error ? error.message : "Unknown error"}</Alert.Description>
          <Button size="sm" ml="auto" onClick={() => refetch()}>Retry</Button>
        </Alert.Root>
      )}

      {data && data.items.length === 0 && (
        <VStack py={12} gap={3}>
          <Text color="text.secondary" fontSize="lg">No prophecies match your filters.</Text>
          <Button variant="outline" onClick={() => setSearchParams({}, { replace: true })}>
            Clear Filters
          </Button>
        </VStack>
      )}

      {data && data.items.length > 0 && (
        <>
          {view === "table" ? (
            <ProphecyTable
              prophecies={data.items}
              sortBy={filters.sort_by ?? "source_book"}
              sortOrder={filters.sort_order ?? "asc"}
              onSort={handleSort}
            />
          ) : (
            <ProphecyCardGrid prophecies={data.items} />
          )}
          <Pagination
            total={data.total}
            limit={data.limit}
            offset={data.offset}
            onChange={handlePageChange}
          />
        </>
      )}
    </VStack>
  );
}
