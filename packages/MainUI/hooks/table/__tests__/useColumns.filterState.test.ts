import type { Column } from "@workspaceui/api-client/src/api/types";
import type { ColumnFilterState } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { resolveColumnFilterState } from "@/hooks/table/useColumns";

jest.mock("@/hooks/navigation/useRedirect", () => ({ useRedirect: () => ({}) }));

const t = ((key: string) => `t:${key}`) as Parameters<typeof resolveColumnFilterState>[3];
const column = { id: "isActive", columnName: "isActive" } as Column;
const persisted: ColumnFilterState = {
  id: "isActive",
  selectedOptions: [{ id: "true", label: "Yes", value: "true" }],
  availableOptions: [],
  loading: false,
  hasMore: false,
  searchQuery: "",
  isMultiSelect: false,
};

describe("resolveColumnFilterState", () => {
  it("returns the persisted state of the column", () => {
    const other = { ...persisted, id: "other" };
    expect(resolveColumnFilterState(column, true, [other, persisted], t)).toBe(persisted);
    expect(resolveColumnFilterState(column, false, [other, persisted], t)).toBe(persisted);
  });

  it("gives a boolean column without a state its true/false options", () => {
    expect(resolveColumnFilterState(column, true, undefined, t)).toEqual({
      id: "isActive",
      selectedOptions: [],
      availableOptions: [
        { id: "true", label: "t:common.trueText", value: "true" },
        { id: "false", label: "t:common.falseText", value: "false" },
      ],
      loading: false,
      hasMore: false,
      searchQuery: "",
      isMultiSelect: false,
    });
  });

  it("leaves a non-boolean column without a state", () => {
    expect(resolveColumnFilterState(column, false, [], t)).toBeUndefined();
    expect(resolveColumnFilterState(column, false, undefined, t)).toBeUndefined();
  });
});
