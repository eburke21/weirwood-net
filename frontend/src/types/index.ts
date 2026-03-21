export type ProphecyType =
  | "verbal_prophecy"
  | "dream_vision"
  | "flame_vision"
  | "song"
  | "house_words"
  | "physical_sign"
  | "greendream"
  | "house_of_undying"
  | "other";

export type ProphecyStatus =
  | "fulfilled"
  | "partially_fulfilled"
  | "unfulfilled"
  | "debated"
  | "subverted";

export interface Prophecy {
  id: number;
  title: string;
  description: string;
  source_character: string;
  source_chapter: string;
  source_book: number;
  prophecy_type: ProphecyType;
  status: ProphecyStatus;
  fulfillment_evidence: string | null;
  subject_characters: string[];
  keywords: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ConnectionType =
  | "thematic_parallel"
  | "shared_fulfillment"
  | "contradiction"
  | "sequential"
  | "reinterpretation";

export interface Connection {
  id: number;
  source_prophecy_id: number;
  target_prophecy_id: number;
  connection_type: ConnectionType;
  confidence: number;
  evidence: string;
  implication: string;
  model_version: string;
  generated_at: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  book: number;
  chapter: string;
  characters_involved: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface GraphNode {
  id: number;
  title: string;
  prophecy_type: ProphecyType;
  status: ProphecyStatus;
  source_book: number;
  connection_count: number;
}

export interface GraphEdge {
  source: number;
  target: number;
  connection_type: ConnectionType;
  confidence: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
