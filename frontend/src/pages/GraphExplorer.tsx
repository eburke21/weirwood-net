import { Heading, Text, VStack, Flex, Box, Spinner, SimpleGrid, Badge } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { useGraphData, type GraphFilters } from "../api/graph";
import ForceGraph from "../components/graph/ForceGraph";
import GraphControls from "../components/graph/GraphControls";
import GraphLegend from "../components/graph/GraphLegend";

export default function GraphExplorer() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<GraphFilters>({});
  const { data, isLoading } = useGraphData(filters);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: Math.max(400, entry.contentRect.width),
          height: Math.max(400, Math.min(700, window.innerHeight - 280)),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleNodeClick = useCallback((id: number) => {
    navigate(`/prophecy/${id}`);
  }, [navigate]);

  return (
    <VStack align="stretch" gap={4}>
      <Box>
        <Heading size="2xl" mb={1}>Explore</Heading>
        <Text color="text.secondary">
          Network graph of prophecy connections. Generate connections on prophecy detail pages to populate edges.
        </Text>
      </Box>

      <GraphControls filters={filters} onChange={setFilters} />

      {data && (
        <Text fontSize="sm" color="text.secondary">
          Showing {data.stats.total_nodes} prophecies and {data.stats.total_edges} connections
          {data.stats.avg_connections > 0 && ` (avg ${data.stats.avg_connections} per node)`}
        </Text>
      )}

      <Box ref={containerRef}>
        {isLoading && (
          <Flex justify="center" py={20}>
            <Spinner size="lg" />
          </Flex>
        )}

        {data && data.nodes.length > 0 && (
          <>
            {/* Graph on md+ screens */}
            <Box display={{ base: "none", md: "block" }}>
              <ForceGraph
                data={data}
                width={dimensions.width}
                height={dimensions.height}
                onNodeClick={handleNodeClick}
              />
            </Box>
            {/* Simple list on mobile */}
            <Box display={{ base: "block", md: "none" }}>
              <Text fontSize="sm" color="text.secondary" mb={3}>
                Graph visualization is best viewed on a larger screen. Showing prophecy list:
              </Text>
              <SimpleGrid columns={1} gap={2}>
                {data.nodes.map((node) => (
                  <Box
                    key={node.id}
                    bg="bg.card"
                    p={3}
                    rounded="md"
                    borderWidth="1px"
                    borderColor="border"
                    cursor="pointer"
                    onClick={() => handleNodeClick(node.id)}
                  >
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="medium" fontSize="sm">{node.title}</Text>
                      {node.connection_count > 0 && (
                        <Badge colorPalette="purple" size="sm">{node.connection_count} links</Badge>
                      )}
                    </Flex>
                    <Text fontSize="xs" color="text.secondary">{node.source_character}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </>
        )}

        {data && data.nodes.length === 0 && (
          <Flex justify="center" py={20}>
            <Text color="text.secondary">No prophecies match the current filters.</Text>
          </Flex>
        )}
      </Box>

      <Box display={{ base: "none", md: "block" }}>
        <GraphLegend />
      </Box>
    </VStack>
  );
}
