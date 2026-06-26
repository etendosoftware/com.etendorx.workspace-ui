import { render, fireEvent, waitFor } from "@testing-library/react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
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

const setupDatasourceMock = (records: Array<Record<string, string>> = []) => {
  const refetch = jest.fn();
  (useTableDirDatasource as jest.Mock).mockReturnValue({
    records,
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

describe("TableDirSelector — default first option for mandatory process combos", () => {
  const SPAIN_ID = "357947E87C284935AD1D783CF6F099A1";
  const USA_ID = "5EFF95EB540740A3B10510D9814EFAD5";
  const INVALID_ORG = "0";
  const ORG_RECORDS = [
    { id: SPAIN_ID, _identifier: "Spain" },
    { id: USA_ID, _identifier: "USA" },
  ];
  const mandatoryField = { ...mockField, isMandatory: true };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProbe = (isProcessModal?: boolean) => {
    let getValue: (() => unknown) | undefined;
    const Probe = () => {
      const { getValues } = useFormContext();
      getValue = () => getValues(FIELD_NAME);
      return null;
    };
    const ProbeWrapper = ({ children }: { children: React.ReactNode }) => {
      const methods = useForm({ defaultValues: { [FIELD_NAME]: INVALID_ORG } });
      return <FormProvider {...methods}>{children}</FormProvider>;
    };
    render(
      <ProbeWrapper>
        <TableDirSelector field={mandatoryField} isReadOnly={false} isProcessModal={isProcessModal} />
        <Probe />
      </ProbeWrapper>
    );
    return () => getValue?.();
  };

  it("replaces an invalid value ('0') with the first valid option in a process modal", async () => {
    setupDatasourceMock(ORG_RECORDS);

    const readValue = renderWithProbe(true);

    await waitFor(() => expect(readValue()).toBe(SPAIN_ID));
  });

  it("keeps the invalid value in a standard window (isProcessModal undefined)", async () => {
    setupDatasourceMock(ORG_RECORDS);

    const readValue = renderWithProbe();

    await waitFor(() => expect(readValue()).toBe(INVALID_ORG));
  });
});
