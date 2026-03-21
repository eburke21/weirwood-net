import { Box, Badge } from "@chakra-ui/react";
import { Table } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../shared/StatusBadge";
import BookBadge from "../shared/BookBadge";
import TypeIcon from "../shared/TypeIcon";
import type { ProphecyListItem } from "../../types";

interface Props {
  prophecies: ProphecyListItem[];
  sortBy: string;
  sortOrder: string;
  onSort: (field: string) => void;
}

const COLUMNS = [
  { key: "title", label: "Title", sortable: true },
  { key: "prophecy_type", label: "Type", sortable: true },
  { key: "source_character", label: "Source", sortable: true },
  { key: "source_book", label: "Book", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "connections", label: "Links", sortable: false },
];

function SortIndicator({ field, sortBy, sortOrder }: { field: string; sortBy: string; sortOrder: string }) {
  if (field !== sortBy) return null;
  return <Box as="span" ml={1}>{sortOrder === "asc" ? "▲" : "▼"}</Box>;
}

export default function ProphecyTable({ prophecies, sortBy, sortOrder, onSort }: Props) {
  const navigate = useNavigate();

  return (
    <Table.ScrollArea>
      <Table.Root size="sm" variant="outline">
        <Table.Header>
          <Table.Row>
            {COLUMNS.map((col) => (
              <Table.ColumnHeader
                key={col.key}
                cursor={col.sortable ? "pointer" : "default"}
                onClick={() => col.sortable && onSort(col.key)}
                _hover={col.sortable ? { color: "accent" } : {}}
              >
                {col.label}
                {col.sortable && <SortIndicator field={col.key} sortBy={sortBy} sortOrder={sortOrder} />}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {prophecies.map((p) => (
            <Table.Row
              key={p.id}
              cursor="pointer"
              onClick={() => navigate(`/prophecy/${p.id}`)}
              _hover={{ bg: "bg.card" }}
            >
              <Table.Cell fontWeight="medium" maxW="300px" truncate>{p.title}</Table.Cell>
              <Table.Cell><TypeIcon type={p.prophecy_type} showLabel={false} /></Table.Cell>
              <Table.Cell fontSize="sm" color="text.secondary">{p.source_character}</Table.Cell>
              <Table.Cell><BookBadge book={p.source_book} /></Table.Cell>
              <Table.Cell><StatusBadge status={p.status} /></Table.Cell>
              <Table.Cell>
                {p.connection_count > 0 && (
                  <Badge colorPalette="purple" size="sm">{p.connection_count}</Badge>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
