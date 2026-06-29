import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps {
  columns: string[]
  data: Record<string, unknown>[]
}

export default function DataTable({ columns, data }: DataTableProps) {
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
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((row: Record<string, unknown>, i: number) => (
            <TableRow key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
              {columns.map((col: string) => (
                <TableCell key={col} className="whitespace-nowrap">
                  {String(row[col.toLowerCase()])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}