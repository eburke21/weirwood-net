import { describe, it, expect } from 'vitest';
import { parseSSEEvents } from '../api/sse';

describe('parseSSEEvents', () => {
  it('parses a single event with explicit event type', () => {
    const text = 'event: status\ndata: {"step":"analyzing"}\n\n';
    const events = parseSSEEvents(text);
    expect(events).toEqual([
      { event: 'status', data: { step: 'analyzing' } },
    ]);
  });

  it('defaults to "message" event type when no event line is present', () => {
    const text = 'data: {"count":42}\n\n';
    const events = parseSSEEvents(text);
    expect(events).toEqual([
      { event: 'message', data: { count: 42 } },
    ]);
  });

  it('parses multiple events', () => {
    const text =
      'event: start\ndata: {"id":1}\n\n' +
      'event: progress\ndata: {"pct":50}\n\n' +
      'event: done\ndata: {"ok":true}\n\n';
    const events = parseSSEEvents(text);
    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ event: 'start', data: { id: 1 } });
    expect(events[1]).toEqual({ event: 'progress', data: { pct: 50 } });
    expect(events[2]).toEqual({ event: 'done', data: { ok: true } });
  });

  it('skips blocks with no data line', () => {
    const text = 'event: heartbeat\n\n';
    const events = parseSSEEvents(text);
    expect(events).toEqual([]);
  });

  it('skips blocks with malformed JSON', () => {
    const text = 'event: bad\ndata: {not valid json}\n\n';
    const events = parseSSEEvents(text);
    expect(events).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(parseSSEEvents('')).toEqual([]);
  });

  it('handles data with nested objects', () => {
    const text = 'event: result\ndata: {"prophecy":{"id":1,"title":"test"}}\n\n';
    const events = parseSSEEvents(text);
    expect(events).toEqual([
      { event: 'result', data: { prophecy: { id: 1, title: 'test' } } },
    ]);
  });

  it('handles whitespace around event and data values', () => {
    const text = 'event:  status \ndata:  {"ok":true} \n\n';
    const events = parseSSEEvents(text);
    expect(events).toEqual([
      { event: 'status', data: { ok: true } },
    ]);
  });

  it('ignores lines that are neither event nor data', () => {
    const text = 'id: 123\nevent: info\nretry: 5000\ndata: {"msg":"hello"}\n\n';
    const events = parseSSEEvents(text);
    expect(events).toEqual([
      { event: 'info', data: { msg: 'hello' } },
    ]);
  });

  it('handles mixed valid and invalid blocks', () => {
    const text =
      'event: good\ndata: {"a":1}\n\n' +
      'data: broken json\n\n' +
      'event: also_good\ndata: {"b":2}\n\n';
    const events = parseSSEEvents(text);
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ event: 'good', data: { a: 1 } });
    expect(events[1]).toEqual({ event: 'also_good', data: { b: 2 } });
  });
});
