import { NextResponse } from "next/server";
import { requireRole, unauthorizedResponse } from "@/lib/authorize";
import prisma from "@/lib/prisma";

const TABLES = [
  "User",
  "Role",
  "Permission",
  "RolePermission",
  "Account",
  "Session",
  "VerificationToken",
  "AuditLog",
  "Dish",
  "Drink",
  "Cart",
  "CartItem",
  "Combo",
  "Address",
  "Order",
  "OrderItem",
  "Store",
  "StoreInventory",
  "PasswordResetToken",
] as const;

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows: Record<string, unknown>[], tableName: string): string {
  if (rows.length === 0) return `Table: ${tableName}\n(empty)\n\n`;

  const headers = Object.keys(rows[0]);
  const lines = [`Table: ${tableName}`, headers.map(escapeCsv).join(",")];

  for (const row of rows) {
    lines.push(headers.map((key) => escapeCsv(row[key])).join(","));
  }

  return lines.join("\n") + "\n\n";
}

export async function GET() {
  const { authorized, session } = await requireRole("admin");

  if (!authorized || !session?.user) {
    return unauthorizedResponse("You do not have permission to export the database");
  }

  try {
    const prismaAny = prisma as unknown as Record<string, { findMany: () => Promise<Record<string, unknown>[]> }>;
    const tableQueries = TABLES.map((table) => prismaAny[table.toLowerCase()].findMany());

    const results = await Promise.all(tableQueries);

    const csvParts: string[] = [];
    results.forEach((rows, index) => {
      const tableName = TABLES[index];
      csvParts.push(toCsv(rows as Record<string, unknown>[], tableName));
    });

    const csvContent = csvParts.join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=database-export-${new Date().toISOString().slice(0, 10)}.csv`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to export database" }, { status: 500 });
  }
}
