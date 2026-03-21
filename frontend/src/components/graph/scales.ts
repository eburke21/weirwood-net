import * as d3 from "d3";
import type { ProphecyType, ConnectionType } from "../../types";

// Node color by prophecy type (colorblind-friendly categorical palette)
const PROPHECY_TYPE_COLORS: Record<ProphecyType, string> = {
  verbal_prophecy: "#4e79a7",
  dream_vision: "#f28e2b",
  flame_vision: "#e15759",
  song: "#76b7b2",
  house_words: "#59a14f",
  physical_sign: "#edc948",
  greendream: "#b07aa1",
  house_of_undying: "#ff9da7",
  other: "#9c755f",
};

export const nodeColorScale = (type: ProphecyType): string =>
  PROPHECY_TYPE_COLORS[type] ?? "#bab0ac";

// Edge color by connection type
const CONNECTION_TYPE_COLORS: Record<ConnectionType, string> = {
  thematic_parallel: "#9467bd",
  shared_fulfillment: "#1f77b4",
  contradiction: "#d62728",
  sequential: "#2ca02c",
  reinterpretation: "#ff7f0e",
};

export const edgeColorScale = (type: ConnectionType): string =>
  CONNECTION_TYPE_COLORS[type] ?? "#999";

// Node radius based on connection count
export const nodeRadiusScale = (connectionCount: number): number =>
  Math.min(30, 8 + connectionCount * 2);

// Edge opacity based on confidence
export const edgeOpacityScale = (confidence: number): number =>
  0.2 + confidence * 0.8;

// Edge dash: contradiction is dashed, others are solid
export const edgeDashScale = (type: ConnectionType): string =>
  type === "contradiction" ? "5,5" : "none";
