import { Flex, Button, Text } from "@chakra-ui/react";

interface Props {
  total: number;
  limit: number;
  offset: number;
  onChange: (offset: number) => void;
}

export default function Pagination({ total, limit, offset, onChange }: Props) {
  if (total <= limit) return null;

  const start = offset + 1;
  const end = Math.min(offset + limit, total);

  return (
    <Flex justify="space-between" align="center" pt={4}>
      <Text fontSize="sm" color="text.secondary">
        Showing {start}–{end} of {total}
      </Text>
      <Flex gap={2}>
        <Button
          size="sm"
          variant="outline"
          disabled={offset === 0}
          onClick={() => onChange(Math.max(0, offset - limit))}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={offset + limit >= total}
          onClick={() => onChange(offset + limit)}
        >
          Next
        </Button>
      </Flex>
    </Flex>
  );
}
