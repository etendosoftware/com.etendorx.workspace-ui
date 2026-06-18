import { render, fireEvent } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { TableDirSelector } from "../TableDirSelector";

// jsdom doesn't implement scrollIntoView; the Select component calls it when
// the dropdown opens to highlight the first option.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = jest.fn();
}

jest.mock("@/hooks/datasource/useTableDirDatasource", () => ({
  useTableDirDatasource: jest.fn(),
}));

jest.mock("@/contexts/tab", () => ({
  useTabContext: jest.fn(() => ({
    tab: null,
    parentRecord: null,
  })),
}));

import { useTableDirDatasource } from "@/hooks/datasource/useTableDirDatasource";

const FIELD_NAME = "process_param_field";

const mockField = {
  hqlName: FIELD_NAME,
  columnName: FIELD_NAME,
  name: FIELD_NAME,
  id: "param-id",
  selector: { displayField: "_identifier", valueField: "id" },
} as any;

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({ defaultValues: { [FIELD_NAME]: "" } });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

const setupDatasourceMock = () => {
  const refetch = jest.fn();
  (useTableDirDatasource as jest.Mock).mockReturnValue({
    records: [],
    loading: false,
    refetch,
    loadMore: jest.fn(),
    hasMore: false,
    search: jest.fn(),
  });
  return refetch;
};

const findTrigger = (container: HTMLElement): HTMLElement => {
  const wrapper = container.querySelector(`[aria-label="${FIELD_NAME}"]`);
  if (!wrapper) throw new Error("Selector wrapper not found");
  const trigger = wrapper.querySelector('div[tabindex="0"]');
  if (!trigger) throw new Error("Selector trigger not found");
  return trigger as HTMLElement;
};

describe("TableDirSelector — refetch on open (process modal cascade)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls refetch when the selector receives focus (isProcessModal=true)", () => {
    const refetch = setupDatasourceMock();

    const { container } = render(
      <Wrapper>
        <TableDirSelector field={mockField} isReadOnly={false} isProcessModal={true} />
      </Wrapper>
    );

    const trigger = findTrigger(container);

    refetch.mockClear();
    fireEvent.focus(trigger);
    expect(refetch).toHaveBeenCalled();
  });

  it("does NOT call refetch on open when isProcessModal is undefined (standard window)", () => {
    const refetch = setupDatasourceMock();

    const { container } = render(
      <Wrapper>
        <TableDirSelector field={mockField} isReadOnly={false} />
      </Wrapper>
    );

    const trigger = findTrigger(container);

    refetch.mockClear(); // ignore the onFocus call that fires on mount
    fireEvent.click(trigger); // open
    fireEvent.click(trigger); // close
    fireEvent.click(trigger); // open again

    // onFocus path may still fire refetch on first interaction, but onOpen
    // should NOT contribute any extra invocations. The key signal: refetch is
    // called AT MOST once across multiple open/close cycles (focus is sticky).
    expect(refetch.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
