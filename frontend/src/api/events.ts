import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./client";
import type { Event } from "../types";

export function fetchEvents() {
  return fetchApi<Event[]>("/api/v1/events");
}

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });
}
