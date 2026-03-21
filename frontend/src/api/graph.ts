import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./client";
import type { GraphData } from "../types";

export interface GraphFilters {
  book?: number;
  type?: string;
  status?: string;
  min_confidence?: number;
}

export function fetchGraphData(filters: GraphFilters = {}) {
  return fetchApi<GraphData>("/api/v1/graph", filters as Record<string, string | number | undefined>);
}

export function useGraphData(filters: GraphFilters = {}) {
  return useQuery({
    queryKey: ["graph", filters],
    queryFn: () => fetchGraphData(filters),
  });
}
