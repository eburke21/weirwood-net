import { SimpleGrid } from "@chakra-ui/react";
import ProphecyCard from "./ProphecyCard";
import type { ProphecyListItem } from "../../types";

export default function ProphecyCardGrid({ prophecies }: { prophecies: ProphecyListItem[] }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
      {prophecies.map((p) => (
        <ProphecyCard key={p.id} prophecy={p} />
      ))}
    </SimpleGrid>
  );
}
