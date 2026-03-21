import { Badge } from "@chakra-ui/react";
import type { ProphecyStatus } from "../../types";

const STATUS_COLORS: Record<ProphecyStatus, string> = {
  fulfilled: "green",
  partially_fulfilled: "yellow",
  unfulfilled: "gray",
  debated: "blue",
  subverted: "red",
};

const STATUS_LABELS: Record<ProphecyStatus, string> = {
  fulfilled: "Fulfilled",
  partially_fulfilled: "Partial",
  unfulfilled: "Unfulfilled",
  debated: "Debated",
  subverted: "Subverted",
};

export default function StatusBadge({ status }: { status: ProphecyStatus }) {
  return (
    <Badge colorPalette={STATUS_COLORS[status]} variant="subtle" size="sm">
      {STATUS_LABELS[status]}
    </Badge>
  );
}
