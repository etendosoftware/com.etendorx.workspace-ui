import { render } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { TableDirSelector } from "../TableDirSelector";

// Mock the datasource hook
jest.mock("@/hooks/datasource/useTableDirDatasource", () => ({
  useTableDirDatasource: jest.fn(),
}));

// Mock the TabContext to avoid "useTabContext must be used within a TabContextProvider" error
jest.mock("@/contexts/tab", () => ({
  useTabContext: jest.fn(() => ({
    tab: null,
    parentRecord: null,
  })),
}));

import { useTableDirDatasource } from "@/hooks/datasource/useTableDirDatasource";

const mockField = {
  hqlName: "testField",
  columnName: "testField",
  name: "testField",
  selector: { displayField: "_identifier", valueField: "id" },
} as any;

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({ defaultValues: { testField: "" } });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe("TableDirSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses static options when provided instead of fetching", () => {
    const staticOptions = [
      { id: "1", name: "Option 1" },
      { id: "2", name: "Option 2" },
    ];

    (useTableDirDatasource as jest.Mock).mockReturnValue({
      records: staticOptions.map((opt) => ({ id: opt.id, _identifier: opt.name })),
      loading: false,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
      search: jest.fn(),
    });

    render(
      <Wrapper>
        <TableDirSelector field={mockField} isReadOnly={false} staticOptions={staticOptions} />
      </Wrapper>
    );

    // Verify hook was called with staticOptions
    expect(useTableDirDatasource).toHaveBeenCalledWith(expect.objectContaining({ staticOptions }));
  });

  it("renders with empty static options array", () => {
    const staticOptions: Array<{ id: string; name: string }> = [];

    (useTableDirDatasource as jest.Mock).mockReturnValue({
      records: [],
      loading: false,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
      search: jest.fn(),
    });

    render(
      <Wrapper>
        <TableDirSelector field={mockField} isReadOnly={false} staticOptions={staticOptions} />
      </Wrapper>
    );

    expect(useTableDirDatasource).toHaveBeenCalledWith(expect.objectContaining({ staticOptions: [] }));
  });

  it("does not pass staticOptions when not provided", () => {
    (useTableDirDatasource as jest.Mock).mockReturnValue({
      records: [],
      loading: false,
      refetch: jest.fn(),
      loadMore: jest.fn(),
      hasMore: false,
      search: jest.fn(),
    });

    render(
      <Wrapper>
        <TableDirSelector field={mockField} isReadOnly={false} />
      </Wrapper>
    );

    expect(useTableDirDatasource).toHaveBeenCalledWith(expect.objectContaining({ staticOptions: undefined }));
  });
});
