import { Box, Flex, Heading, Text, Badge } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../shared/StatusBadge";
import BookBadge from "../shared/BookBadge";
import TypeIcon from "../shared/TypeIcon";
import type { ProphecyListItem } from "../../types";

export default function ProphecyCard({ prophecy }: { prophecy: ProphecyListItem }) {
  const navigate = useNavigate();

  return (
    <Box
      bg="bg.card"
      borderWidth="1px"
      borderColor="border"
      rounded="lg"
      p={4}
      cursor="pointer"
      onClick={() => navigate(`/prophecy/${prophecy.id}`)}
      _hover={{ borderColor: "accent", shadow: "md" }}
      transition="all 0.15s"
      position="relative"
    >
      <Flex justify="space-between" align="start" mb={2}>
        <TypeIcon type={prophecy.prophecy_type} />
        {prophecy.connection_count > 0 && (
          <Badge colorPalette="purple" size="sm">{prophecy.connection_count} links</Badge>
        )}
      </Flex>

      <Heading size="sm" mb={2} lineClamp={2}>{prophecy.title}</Heading>

      <Text fontSize="sm" color="text.secondary" mb={3} lineClamp={3}>
        {prophecy.description}
      </Text>

      <Flex gap={2} wrap="wrap" align="center">
        <StatusBadge status={prophecy.status} />
        <BookBadge book={prophecy.source_book} />
        <Text fontSize="xs" color="text.secondary">{prophecy.source_character}</Text>
      </Flex>
    </Box>
  );
}
