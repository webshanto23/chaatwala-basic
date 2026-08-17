import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import DataTable from "@/components/admin/data-table";

describe("DataTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const columns = ["Name", "Price", "Status"];
  const data = [
    { name: "Dish 1", price: 200, status: "available" },
    { name: "Dish 2", price: 150, status: "unavailable" },
    { name: "Dish 3", price: 300, status: "available" },
  ];

  it("renders table with columns and data", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText("Name")).toBeDefined();
    expect(screen.getByText("Price")).toBeDefined();
    expect(screen.getByText("Status")).toBeDefined();
    expect(screen.getByText("Dish 1")).toBeDefined();
    expect(screen.getByText("Dish 2")).toBeDefined();
    expect(screen.getByText("Dish 3")).toBeDefined();
  });

  it("renders empty table when no data", () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.queryByText("Dish 1")).toBeNull();
  });

  it("filters data based on filter prop", () => {
    render(<DataTable columns={columns} data={data} filter="Dish 1" />);
    expect(screen.getByText("Dish 1")).toBeDefined();
    expect(screen.queryByText("Dish 2")).toBeNull();
    expect(screen.queryByText("Dish 3")).toBeNull();
  });

  it("filters data case-insensitively", () => {
    render(<DataTable columns={columns} data={data} filter="dish 2" />);
    expect(screen.getByText("Dish 2")).toBeDefined();
    expect(screen.queryByText("Dish 1")).toBeNull();
  });

  it("renders action buttons when showActions is true", () => {
    render(<DataTable columns={columns} data={data} showActions />);
    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(editButtons).toHaveLength(3);
    expect(deleteButtons).toHaveLength(3);
  });

  it("calls onEdit and onDelete when action buttons are clicked", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<DataTable columns={columns} data={data} showActions onEdit={onEdit} onDelete={onDelete} />);

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });

    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(data[0]);

    fireEvent.click(deleteButtons[1]);
    expect(onDelete).toHaveBeenCalledWith(data[1]);
  });

  it("calls onRowClick when row is clicked", () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);

    const row = screen.getByText("Dish 1").closest("tr");
    fireEvent.click(row!);
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it("does not call onRowClick when action button is clicked", () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} showActions onRowClick={onRowClick} />);

    const editButton = screen.getAllByRole("button", { name: /edit/i })[0];
    fireEvent.click(editButton);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("renders custom cells when renderCell is provided", () => {
    const renderCell = vi.fn((col: string, row: Record<string, unknown>) => {
      if (col === "Price") {
        return <span>৳ {row.price}</span>;
      }
      return String(row[col.toLowerCase()]);
    });

    render(<DataTable columns={columns} data={data} renderCell={renderCell} />);
    expect(screen.getByText("৳ 200")).toBeDefined();
  });

  it("handles lowercase column names in data", () => {
    const lowercaseColumns = ["name", "price", "status"];
    render(<DataTable columns={lowercaseColumns} data={data} />);
    expect(screen.getByText("Dish 1")).toBeDefined();
    expect(screen.getByText("200")).toBeDefined();
    const statusCells = screen.getAllByText("available");
    expect(statusCells.length).toBe(2);
  });
});
