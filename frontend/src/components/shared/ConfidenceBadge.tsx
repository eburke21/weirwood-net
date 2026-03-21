import { Badge } from "@chakra-ui/react";

function getColor(confidence: number): string {
  if (confidence >= 0.67) return "green";
  if (confidence >= 0.34) return "yellow";
  return "red";
}

export default function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  return (
    <Badge colorPalette={getColor(confidence)} variant="subtle" size="sm">
      {pct}%
    </Badge>
  );
}
