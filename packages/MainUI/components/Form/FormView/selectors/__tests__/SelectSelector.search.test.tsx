import { render } from "@testing-library/react";
import type { Field } from "@workspaceui/api-client/src/api/types";
import Select from "../components/Select/Select";
import { SelectSelector } from "../SelectSelector";

const mockSearch = jest.fn();
const mockRefetch = jest.fn();

jest.mock("@/hooks/datasource/useTableDirDatasource", () => ({
  useTableDirDatasource: jest.fn(() => ({
    records: [],
    loading: false,
    refetch: mockRefetch,
    loadMore: jest.fn(),
    hasMore: false,
    search: mockSearch,
    minSearchChars: 3,
  })),
}));

jest.mock("@/hooks/useSelectFieldOptions", () => ({
  useSelectFieldOptions: jest.fn(() => []),
}));

jest.mock("../components/Select/Select", () => jest.fn(() => null));

const field = { hqlName: "businessPartner", columnName: "C_BPartner_ID", name: "Business Partner" } as unknown as Field;

describe("SelectSelector search", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sends the typed text to the datasource, as the other search selectors do", () => {
    render(<SelectSelector field={field} isReadOnly={false} />);

    const props = (Select as unknown as jest.Mock).mock.lastCall?.[0];
    expect(props.onSearch).toBe(mockSearch);
  });

  it("passes the minimum number of characters of the datasource", () => {
    render(<SelectSelector field={field} isReadOnly={false} />);

    const props = (Select as unknown as jest.Mock).mock.lastCall?.[0];
    expect(props.minSearchChars).toBe(3);
  });
});
