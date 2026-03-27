import { useRef, useEffect } from "react";
import * as d3 from "d3";
import {
  nodeColorScale,
  nodeRadiusScale,
  edgeColorScale,
  edgeOpacityScale,
  edgeDashScale,
} from "./scales";
import type { GraphData, GraphNode, GraphEdge } from "../../types";

interface SimNode extends GraphNode, d3.SimulationNodeDatum {}
interface SimEdge extends d3.SimulationLinkDatum<SimNode> {
  connection_type: GraphEdge["connection_type"];
  confidence: number;
}

interface Props {
  data: GraphData;
  width: number;
  height: number;
  onNodeClick: (id: number) => void;
}

export default function ForceGraph({ data, width, height, onNodeClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Prepare data copies for D3 mutation
    const nodes: SimNode[] = data.nodes.map((n) => ({ ...n }));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const edges: SimEdge[] = data.edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({
        source: nodeMap.get(e.source)!,
        target: nodeMap.get(e.target)!,
        connection_type: e.connection_type,
        confidence: e.confidence,
      }));

    // Zoom container
    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(edges).id((d: d3.SimulationNodeDatum) => (d as SimNode).id).distance(120))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: d3.SimulationNodeDatum) => nodeRadiusScale((d as SimNode).connection_count) + 5))
      .alphaDecay(0.02);

    // Edges
    const edgeSelection = g.append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", (d) => edgeColorScale(d.connection_type))
      .attr("stroke-opacity", (d) => edgeOpacityScale(d.confidence))
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", (d) => edgeDashScale(d.connection_type));

    // Nodes
    const nodeSelection = g.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => nodeRadiusScale(d.connection_count))
      .attr("fill", (d) => nodeColorScale(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("cursor", "pointer")
      .on("click", (_event, d) => onNodeClick(d.id))
      .on("mouseover", function (_event, d) {
        d3.select(this).attr("r", nodeRadiusScale(d.connection_count) + 3);
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "block";
          tooltipRef.current.textContent = `${d.title} (${d.source_character})`;
        }
      })
      .on("mousemove", (event) => {
        if (tooltipRef.current) {
          tooltipRef.current.style.left = event.pageX + 12 + "px";
          tooltipRef.current.style.top = event.pageY - 12 + "px";
        }
      })
      .on("mouseout", function (_event, d) {
        d3.select(this).attr("r", nodeRadiusScale(d.connection_count));
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "none";
        }
      })
      .call(d3.drag<SVGCircleElement, SimNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as unknown as (selection: d3.Selection<d3.BaseType | SVGCircleElement, SimNode, SVGGElement, unknown>) => void
      );

    // Labels (only for connected nodes)
    const labelSelection = g.append("g")
      .selectAll("text")
      .data(nodes.filter((n) => n.connection_count > 0))
      .join("text")
      .text((d) => d.title.length > 20 ? d.title.slice(0, 18) + "..." : d.title)
      .attr("font-size", "10px")
      .attr("fill", "#888")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => -nodeRadiusScale(d.connection_count) - 5)
      .attr("pointer-events", "none");

    // Tick update
    simulation.on("tick", () => {
      edgeSelection
        .attr("x1", (d) => ((d.source as unknown as SimNode).x ?? 0))
        .attr("y1", (d) => ((d.source as unknown as SimNode).y ?? 0))
        .attr("x2", (d) => ((d.target as unknown as SimNode).x ?? 0))
        .attr("y2", (d) => ((d.target as unknown as SimNode).y ?? 0));

      nodeSelection
        .attr("cx", (d) => (d.x ?? 0))
        .attr("cy", (d) => (d.y ?? 0));

      labelSelection
        .attr("x", (d) => (d.x ?? 0))
        .attr("y", (d) => (d.y ?? 0));
    });

    return () => { simulation.stop(); };
  }, [data, width, height, onNodeClick]);

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} width={width} height={height} style={{ background: "var(--chakra-colors-bg-surface, #f7f7f7)", borderRadius: "8px" }} />
      <div
        ref={tooltipRef}
        style={{
          display: "none",
          position: "fixed",
          padding: "6px 10px",
          background: "rgba(0,0,0,0.8)",
          color: "#fff",
          borderRadius: "4px",
          fontSize: "12px",
          pointerEvents: "none",
          zIndex: 100,
        }}
      />
    </div>
  );
}
