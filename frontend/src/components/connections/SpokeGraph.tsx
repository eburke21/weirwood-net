import { useRef, useEffect } from "react";
import * as d3 from "d3";
import { nodeColorScale, edgeColorScale, edgeDashScale, edgeOpacityScale } from "../graph/scales";
import type { ProphecyType, ConnectionType } from "../../types";

interface SpokeNode {
  id: number;
  title: string;
  type: ProphecyType;
  connectionType: ConnectionType;
  confidence: number;
}

interface Props {
  centralTitle: string;
  centralType: ProphecyType;
  connections: SpokeNode[];
  onNodeClick: (id: number) => void;
}

const SIZE = 400;
const CENTER = SIZE / 2;
const SPOKE_RADIUS = 140;
const CENTER_RADIUS = 18;
const SPOKE_NODE_RADIUS = 12;

export default function SpokeGraph({ centralTitle, centralType, connections, onNodeClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || connections.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Calculate spoke positions in a circle
    const angleStep = (2 * Math.PI) / connections.length;
    const spokePositions = connections.map((conn, i) => ({
      ...conn,
      x: CENTER + SPOKE_RADIUS * Math.cos(i * angleStep - Math.PI / 2),
      y: CENTER + SPOKE_RADIUS * Math.sin(i * angleStep - Math.PI / 2),
    }));

    // Draw edges
    g.selectAll("line")
      .data(spokePositions)
      .join("line")
      .attr("x1", CENTER)
      .attr("y1", CENTER)
      .attr("x2", (d) => d.x)
      .attr("y2", (d) => d.y)
      .attr("stroke", (d) => edgeColorScale(d.connectionType))
      .attr("stroke-opacity", (d) => edgeOpacityScale(d.confidence))
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", (d) => edgeDashScale(d.connectionType));

    // Draw spoke nodes
    g.selectAll("circle.spoke")
      .data(spokePositions)
      .join("circle")
      .attr("class", "spoke")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", SPOKE_NODE_RADIUS)
      .attr("fill", (d) => nodeColorScale(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("cursor", "pointer")
      .on("click", (_event, d) => onNodeClick(d.id))
      .on("mouseover", function (_event, d) {
        d3.select(this).attr("r", SPOKE_NODE_RADIUS + 3);
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "block";
          tooltipRef.current.textContent = d.title;
        }
      })
      .on("mousemove", (event) => {
        if (tooltipRef.current) {
          tooltipRef.current.style.left = event.pageX + 12 + "px";
          tooltipRef.current.style.top = event.pageY - 12 + "px";
        }
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", SPOKE_NODE_RADIUS);
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "none";
        }
      });

    // Spoke labels
    g.selectAll("text.spoke-label")
      .data(spokePositions)
      .join("text")
      .attr("class", "spoke-label")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y - SPOKE_NODE_RADIUS - 6)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("fill", "#888")
      .text((d) => d.title.length > 18 ? d.title.slice(0, 16) + "..." : d.title);

    // Draw central node (on top)
    g.append("circle")
      .attr("cx", CENTER)
      .attr("cy", CENTER)
      .attr("r", CENTER_RADIUS)
      .attr("fill", nodeColorScale(centralType))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    g.append("text")
      .attr("x", CENTER)
      .attr("y", CENTER - CENTER_RADIUS - 6)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("fill", "#666")
      .text(centralTitle.length > 22 ? centralTitle.slice(0, 20) + "..." : centralTitle);
  }, [centralTitle, centralType, connections, onNodeClick]);

  if (connections.length === 0) return null;

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} width={SIZE} height={SIZE} style={{ maxWidth: "100%" }} />
      <div
        ref={tooltipRef}
        style={{
          display: "none",
          position: "fixed",
          padding: "4px 8px",
          background: "rgba(0,0,0,0.8)",
          color: "#fff",
          borderRadius: "4px",
          fontSize: "11px",
          pointerEvents: "none",
          zIndex: 100,
        }}
      />
    </div>
  );
}
