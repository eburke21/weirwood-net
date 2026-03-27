import {
  Heading, Text, VStack, Box, SimpleGrid, Badge,
  Separator,
} from "@chakra-ui/react";
import { Table } from "@chakra-ui/react";

const TECH_STACK = [
  { name: "React 18", category: "Frontend", color: "blue" },
  { name: "TypeScript", category: "Frontend", color: "blue" },
  { name: "Chakra UI v3", category: "Frontend", color: "blue" },
  { name: "D3.js", category: "Frontend", color: "blue" },
  { name: "TanStack Query", category: "Frontend", color: "blue" },
  { name: "Framer Motion", category: "Frontend", color: "blue" },
  { name: "FastAPI", category: "Backend", color: "green" },
  { name: "Python 3.12", category: "Backend", color: "green" },
  { name: "SQLModel", category: "Backend", color: "green" },
  { name: "SQLite + FTS5", category: "Backend", color: "green" },
  { name: "Claude API", category: "AI", color: "purple" },
  { name: "SSE Streaming", category: "AI", color: "purple" },
  { name: "Docker Compose", category: "Infra", color: "orange" },
  { name: "Vite", category: "Infra", color: "orange" },
  { name: "uv", category: "Infra", color: "orange" },
];

const SKILLS = [
  {
    skill: "Entity extraction & relationship detection",
    demo: "Prophecy-to-prophecy connection mapping via structured LLM output",
    relevance: "Knowledge graph construction, content recommendation",
  },
  {
    skill: "Pattern matching across unstructured text",
    demo: "AI identifies thematic parallels, contradictions, and sequential links across a large corpus",
    relevance: "Signal detection in unstructured data — compliance, intelligence, content moderation",
  },
  {
    skill: "Speculative reasoning with constraints",
    demo: "TWOW predictions constrained by textual evidence, not hallucination",
    relevance: "Controlled generation, RAG systems, AI guardrails",
  },
  {
    skill: "Graph visualization",
    demo: "D3 force-directed graph + focused spoke views for prophecy networks",
    relevance: "Data visualization, network analysis dashboards",
  },
  {
    skill: "Streaming AI responses (SSE)",
    demo: "Long-form analyses stream token-by-token; structured results stream as cards",
    relevance: "Real-time AI product UX patterns",
  },
  {
    skill: "Full-stack data curation UX",
    demo: "Browse, filter, search, and drill into a hand-curated domain dataset",
    relevance: "Any CRUD-heavy internal tool or data platform",
  },
];

export default function About() {
  return (
    <VStack align="stretch" gap={8}>
      {/* Header */}
      <Box>
        <Heading size="2xl" mb={2}>About Weirwood.net</Heading>
        <Text fontSize="lg" color="text.secondary">
          A literary analysis engine that catalogs every known prophecy in A Song of Ice and Fire,
          tracks fulfillment status, and uses AI to surface non-obvious relationships between them.
        </Text>
      </Box>

      <Separator />

      {/* Motivation */}
      <Box>
        <Heading size="lg" mb={2}>Why This Project</Heading>
        <Text color="text.secondary" mb={3}>
          George R.R. Martin's ASOIAF contains one of the densest webs of prophecy and foreshadowing
          in modern literature. Hundreds of predictions are scattered across five books, thousands of pages,
          and dozens of POV characters. Fans track these manually, but no tool exists to systematically
          catalog them, map their interconnections, or use AI to find patterns.
        </Text>
        <Text color="text.secondary">
          Weirwood.net demonstrates how AI-powered analysis can be applied to complex, interconnected
          unstructured data — the same skills that drive knowledge graph construction, content
          recommendation, and compliance analysis in industry.
        </Text>
      </Box>

      <Separator />

      {/* Tech Stack */}
      <Box>
        <Heading size="lg" mb={3}>Tech Stack</Heading>
        <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} gap={3}>
          {TECH_STACK.map((tech) => (
            <Box key={tech.name} bg="bg.card" p={3} rounded="md" borderWidth="1px" borderColor="border" textAlign="center">
              <Text fontWeight="medium" fontSize="sm">{tech.name}</Text>
              <Badge colorPalette={tech.color} variant="subtle" size="sm" mt={1}>{tech.category}</Badge>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Separator />

      {/* Skills Demonstrated */}
      <Box>
        <Heading size="lg" mb={3}>Skills Demonstrated</Heading>
        <Table.ScrollArea>
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Skill</Table.ColumnHeader>
                <Table.ColumnHeader>How It's Demonstrated</Table.ColumnHeader>
                <Table.ColumnHeader display={{ base: "none", md: "table-cell" }}>Industry Relevance</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {SKILLS.map((s) => (
                <Table.Row key={s.skill}>
                  <Table.Cell fontWeight="medium" fontSize="sm">{s.skill}</Table.Cell>
                  <Table.Cell fontSize="sm" color="text.secondary">{s.demo}</Table.Cell>
                  <Table.Cell fontSize="sm" color="text.secondary" display={{ base: "none", md: "table-cell" }}>{s.relevance}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      </Box>

      <Separator />

      {/* Architecture */}
      <Box>
        <Heading size="lg" mb={2}>Architecture</Heading>
        <Text color="text.secondary" mb={3}>
          Monorepo with FastAPI backend + React frontend, connected via REST API and SSE for AI streaming.
          SQLite database with FTS5 full-text search. Docker Compose for single-command deployment.
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Box bg="bg.card" p={4} rounded="md" borderWidth="1px" borderColor="border">
            <Heading size="sm" mb={2}>Backend</Heading>
            <Text fontSize="sm" color="text.secondary">
              FastAPI serves a REST API with pagination, filtering, and FTS5 search.
              AI service calls the Claude API for connection discovery, fulfillment analysis, and TWOW predictions.
              Results are cached in SQLite and streamed to the frontend via Server-Sent Events.
            </Text>
          </Box>
          <Box bg="bg.card" p={4} rounded="md" borderWidth="1px" borderColor="border">
            <Heading size="sm" mb={2}>Frontend</Heading>
            <Text fontSize="sm" color="text.secondary">
              React with Chakra UI for components, TanStack Query for server state management,
              D3.js for force-directed graph visualization, and Framer Motion for animations.
              Custom SSE hook consumes streaming AI responses for progressive rendering.
            </Text>
          </Box>
        </SimpleGrid>
      </Box>

      <Separator />

      {/* Data Methodology */}
      <Box>
        <Heading size="lg" mb={2}>Data Methodology</Heading>
        <Text color="text.secondary">
          The seed dataset is hand-curated from the five published ASOIAF novels. All prophecy descriptions
          are paraphrased (not direct quotes) and cross-referenced against chapter lists for accuracy.
          Each entry includes the source character, chapter citation, prophecy type classification,
          fulfillment status with evidence, subject characters, and thematic keywords.
          Books-only scope — no TV show content.
        </Text>
      </Box>

      <Separator />

      {/* Credits */}
      <Box>
        <Heading size="lg" mb={2}>Credits</Heading>
        <VStack align="start" gap={1}>
          <Text fontSize="sm" color="text.secondary">Source material: <em>A Song of Ice and Fire</em> by George R.R. Martin</Text>
          <Text fontSize="sm" color="text.secondary">Reference: ASOIAF wiki community for chapter listings and prophecy cataloging</Text>
          <Text fontSize="sm" color="text.secondary">AI analysis powered by Anthropic's Claude API</Text>
        </VStack>
      </Box>
    </VStack>
  );
}
