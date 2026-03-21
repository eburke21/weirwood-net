export interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}

export function parseSSEEvents(text: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const blocks = text.split("\n\n").filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n");
    let event = "message";
    let data = "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data = line.slice(5).trim();
      }
    }

    if (data) {
      try {
        events.push({ event, data: JSON.parse(data) });
      } catch {
        // Skip malformed data
      }
    }
  }

  return events;
}
