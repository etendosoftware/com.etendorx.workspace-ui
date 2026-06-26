import type { SelectOption } from "@/components/Form/FormView/selectors/components/types";
import { useDefaultFirstOption } from "@/hooks/useDefaultFirstOption";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

const FIELD_NAME = "AD_Org_ID";
const SPAIN_ID = "357947E87C284935AD1D783CF6F099A1";
const SPAIN_LABEL = "Spain";
const USA_ID = "5EFF95EB540740A3B10510D9814EFAD5";
const USA_LABEL = "USA";
const INVALID_ORG = "0";

const ORG_OPTIONS: SelectOption[] = [
  { id: SPAIN_ID, label: SPAIN_LABEL },
  { id: USA_ID, label: USA_LABEL },
];

const buildField = (overrides: Record<string, unknown> = {}): Field =>
  ({
    hqlName: FIELD_NAME,
    name: FIELD_NAME,
    columnName: FIELD_NAME,
    isMandatory: true,
    ...overrides,
  }) as unknown as Field;

interface HarnessProps {
  field: ReturnType<typeof buildField>;
  options: SelectOption[];
  loading: boolean;
  enabled: boolean;
}

/** Runs the hook and exposes the form context so tests can read the resulting value. */
const useHarness = (props: HarnessProps) => {
  useDefaultFirstOption(props);
  return useFormContext();
};

const renderHarness = (props: HarnessProps, defaultValues: Record<string, unknown>) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const methods = useForm({ defaultValues });
    return <FormProvider {...methods}>{children}</FormProvider>;
  };
  return renderHook((p: HarnessProps) => useHarness(p), { wrapper: Wrapper, initialProps: props });
};

describe("useDefaultFirstOption", () => {
  it("selects the first option when a mandatory value is not in the options (the '*' org case)", () => {
    const { result } = renderHarness(
      { field: buildField(), options: ORG_OPTIONS, loading: false, enabled: true },
      { [FIELD_NAME]: INVALID_ORG }
    );

    expect(result.current.getValues(FIELD_NAME)).toBe(SPAIN_ID);
    expect(result.current.getValues(`${FIELD_NAME}$_identifier`)).toBe(SPAIN_LABEL);
  });

  it("selects the first option when a mandatory value is empty", () => {
    const { result } = renderHarness(
      { field: buildField(), options: ORG_OPTIONS, loading: false, enabled: true },
      { [FIELD_NAME]: "" }
    );

    expect(result.current.getValues(FIELD_NAME)).toBe(SPAIN_ID);
  });

  it("keeps a mandatory value that is already a valid option", () => {
    const { result } = renderHarness(
      { field: buildField(), options: ORG_OPTIONS, loading: false, enabled: true },
      { [FIELD_NAME]: USA_ID }
    );

    expect(result.current.getValues(FIELD_NAME)).toBe(USA_ID);
  });

  it("does not touch optional fields with an invalid value", () => {
    const { result } = renderHarness(
      { field: buildField({ isMandatory: false }), options: ORG_OPTIONS, loading: false, enabled: true },
      { [FIELD_NAME]: INVALID_ORG }
    );

    expect(result.current.getValues(FIELD_NAME)).toBe(INVALID_ORG);
  });

  it("does nothing outside a process modal (enabled=false)", () => {
    const { result } = renderHarness(
      { field: buildField(), options: ORG_OPTIONS, loading: false, enabled: false },
      { [FIELD_NAME]: INVALID_ORG }
    );

    expect(result.current.getValues(FIELD_NAME)).toBe(INVALID_ORG);
  });

  it("waits for options to load, then applies once", () => {
    const { result, rerender } = renderHarness(
      { field: buildField(), options: [], loading: true, enabled: true },
      { [FIELD_NAME]: INVALID_ORG }
    );

    // Still loading with no options: untouched.
    expect(result.current.getValues(FIELD_NAME)).toBe(INVALID_ORG);

    rerender({ field: buildField(), options: ORG_OPTIONS, loading: false, enabled: true });

    expect(result.current.getValues(FIELD_NAME)).toBe(SPAIN_ID);
  });

  it("is one-shot: a later user edit is never overridden", () => {
    const { result, rerender } = renderHarness(
      { field: buildField(), options: ORG_OPTIONS, loading: false, enabled: true },
      { [FIELD_NAME]: INVALID_ORG }
    );

    expect(result.current.getValues(FIELD_NAME)).toBe(SPAIN_ID);

    // The user edits to a value that is not in the (now-stale) options.
    act(() => {
      result.current.setValue(FIELD_NAME, INVALID_ORG);
    });
    rerender({ field: buildField(), options: ORG_OPTIONS, loading: false, enabled: true });

    expect(result.current.getValues(FIELD_NAME)).toBe(INVALID_ORG);
  });
});
