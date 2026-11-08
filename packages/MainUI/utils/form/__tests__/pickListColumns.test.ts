import { formatPickListCell, getPickListColumns } from "../pickListColumns";

describe("getPickListColumns", () => {
  const column = (accessorKey: string) => ({ id: accessorKey, header: accessorKey, accessorKey });

  it("returns undefined without extra columns, so the dropdown keeps a single column", () => {
    expect(getPickListColumns(undefined)).toBeUndefined();
    expect(getPickListColumns([])).toBeUndefined();
    expect(getPickListColumns([column("name")])).toBeUndefined();
  });

  it("keeps the order of the columns the server sent", () => {
    const result = getPickListColumns([column("name"), column("available"), column("nettable")]);
    expect(result?.map((c) => c.accessorKey)).toEqual(["name", "available", "nettable"]);
  });
});

describe("formatPickListCell", () => {
  it("shows Yes/No values as a checked or unchecked box", () => {
    expect(formatPickListCell(true, undefined, "20")).toBe("☑");
    expect(formatPickListCell("Y", undefined, "20")).toBe("☑");
    expect(formatPickListCell(false, undefined, "20")).toBe("☐");
    expect(formatPickListCell("N", undefined, "20")).toBe("☐");
    expect(formatPickListCell(false, undefined)).toBe("☐");
  });

  it("prefers the identifier of a foreign key and falls back to a dash when empty", () => {
    expect(formatPickListCell("ID1", "Warehouse A")).toBe("Warehouse A");
    expect(formatPickListCell("Plain", undefined)).toBe("Plain");
    expect(formatPickListCell(undefined, undefined)).toBe("-");
    expect(formatPickListCell("", undefined)).toBe("-");
  });
});
