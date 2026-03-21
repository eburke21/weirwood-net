import { SimpleGrid } from "@chakra-ui/react";
import { motion } from "framer-motion";
import ProphecyCard from "./ProphecyCard";
import type { ProphecyListItem } from "../../types";

export default function ProphecyCardGrid({ prophecies }: { prophecies: ProphecyListItem[] }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
      {prophecies.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.4) }}
        >
          <ProphecyCard prophecy={p} />
        </motion.div>
      ))}
    </SimpleGrid>
  );
}
