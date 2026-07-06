import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit3, Trash2 } from "lucide-react"

interface DataTableProps {
  columns: string[]
  data: Record<string, unknown>[]
  showActions?: boolean
  onEdit?: (row: Record<string, unknown>) => void
  onDelete?: (row: Record<string, unknown>) => void
  filter?: string
}

export default function DataTable({ columns, data, showActions = false, onEdit, onDelete, filter = "" }: DataTableProps) {
  const q = filter.trim().toLowerCase()
  const filtered = q
    ? data.filter((row) =>
        Object.values(row)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    : data

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="border-b border-border">
            {columns.map((col: string) => (
              <TableHead key={col} className="whitespace-nowrap">
                {col}
              </TableHead>
            ))}
            {showActions && <TableHead className="whitespace-nowrap">Actions</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {filtered.map((row: Record<string, unknown>, i: number) => (
            <TableRow key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
              {columns.map((col: string) => (
                <TableCell key={col} className="whitespace-nowrap">
                  {String(row[col.toLowerCase()])}
                </TableCell>
              ))}

              {showActions && (
                <TableCell className="flex gap-2 whitespace-nowrap">
                  <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => onEdit && onEdit(row)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" aria-label="Delete" onClick={() => onDelete && onDelete(row)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}