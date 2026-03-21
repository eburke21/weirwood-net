import { Badge } from "@chakra-ui/react";

const BOOK_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: "AGOT", color: "gray" },
  2: { label: "ACOK", color: "purple" },
  3: { label: "ASOS", color: "red" },
  4: { label: "AFFC", color: "yellow" },
  5: { label: "ADWD", color: "blue" },
};

export default function BookBadge({ book }: { book: number }) {
  const config = BOOK_CONFIG[book] ?? { label: `Book ${book}`, color: "gray" };
  return (
    <Badge colorPalette={config.color} variant="outline" size="sm">
      {config.label}
    </Badge>
  );
}
