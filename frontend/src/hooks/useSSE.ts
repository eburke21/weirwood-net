import { useState, useRef, useCallback } from "react";
import { parseSSEEvents, type SSEEvent } from "../api/sse";
import { API_BASE } from "../config";

interface UseSSEOptions {
  endpoint: string;
  method?: "GET" | "POST";
  body?: object;
}

interface UseSSEReturn {
  events: SSEEvent[];
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
  start: () => void;
  reset: () => void;
}

export function useSSE({ endpoint, method = "POST", body }: UseSSEOptions): UseSSEReturn {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setEvents([]);
    setIsStreaming(false);
    setIsComplete(false);
    setError(null);
  }, []);

  const start = useCallback(() => {
    reset();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    const fetchOptions: RequestInit = {
      method,
      signal: controller.signal,
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
    };
    if (body && method === "POST") {
      fetchOptions.body = JSON.stringify(body);
    }

    (async () => {
      // Flush one block of buffered SSE text into state. Returns the
      // bytes consumed so the caller can advance the buffer.
      const processBlocks = (text: string): string => {
        // Normalize CRLF → LF per the SSE spec (WHATWG): servers may use
        // "\r\n\r\n", "\n\n", or "\r\r" as the event terminator. Strip all
        // CRs so everything downstream can split on "\n\n" only.
        const normalized = text.replace(/\r\n?/g, "\n");
        const parts = normalized.split("\n\n");
        const leftover = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.trim()) continue;
          const parsed = parseSSEEvents(part + "\n\n");
          for (const evt of parsed) {
            if (evt.event === "complete") {
              setIsComplete(true);
            } else if (evt.event === "error") {
              setError((evt.data as { message?: string }).message ?? "Unknown error");
            }
            setEvents((prev) => [...prev, evt]);
          }
        }
        return leftover;
      };

      try {
        const response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
        if (!response.ok) {
          const errBody = await response.text();
          setError(`Request failed: ${response.status} ${errBody}`);
          setIsStreaming(false);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setError("No response body");
          setIsStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          buffer = processBlocks(buffer);
        }

        // Flush any trailing bytes (servers that omit a final blank line).
        const tail = buffer + decoder.decode();
        if (tail.trim()) processBlocks(tail + "\n\n");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message ?? "Stream failed");
        }
      } finally {
        setIsStreaming(false);
      }
    })();
  }, [endpoint, method, body, reset]);

  return { events, isStreaming, isComplete, error, start, reset };
}
