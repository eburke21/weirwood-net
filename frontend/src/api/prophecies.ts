import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./client";
import type { PaginatedResponse, ProphecyListItem, ProphecyDetail, ProphecyFilters } from "../types";

export function fetchProphecies(params: ProphecyFilters = {}) {
  return fetchApi<PaginatedResponse<ProphecyListItem>>("/api/v1/prophecies", params as Record<string, string | number | undefined>);
}

export function fetchProphecy(id: number) {
  return fetchApi<ProphecyDetail>(`/api/v1/prophecies/${id}`);
}

export function useProphecies(params: ProphecyFilters = {}) {
  return useQuery({
    queryKey: ["prophecies", params],
    queryFn: () => fetchProphecies(params),
  });
}

export function useProphecy(id: number) {
  return useQuery({
    queryKey: ["prophecy", id],
    queryFn: () => fetchProphecy(id),
    enabled: id > 0,
  });
}
