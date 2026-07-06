import { render, renderHook } from "@testing-library/react";
import type React from "react";
import { WindowReferenceGridProvider, useWindowReferenceGridContext } from "../WindowReferenceGridContext";
import "@testing-library/jest-dom";

const makeContextValue = (overrides: Record<string, unknown> = {}) => ({
  effectiveRecordValuesRef: { current: {} },
  parametersRef: { current: {} },
  fieldsRef: { current: [] },
  handleRecordChangeRef: { current: null },
  validationsRef: { current: [] },
  validations: [],
  session: null,
  tabId: "TAB-001",
  fieldReadOnlyMap: {},
  shouldSendOrg: false,
  createRowErrors: new Set<string>(),
  clearCellError: jest.fn(),
  ...overrides,
});

describe("WindowReferenceGridProvider", () => {
  it("renders children", () => {
    const { getByText } = render(
      <WindowReferenceGridProvider value={makeContextValue()}>
        <span>child</span>
      </WindowReferenceGridProvider>
    );
    expect(getByText("child")).toBeInTheDocument();
  });
});

describe("useWindowReferenceGridContext", () => {
  it("returns context value when used inside provider", () => {
    const value = makeContextValue();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WindowReferenceGridProvider value={value}>{children}</WindowReferenceGridProvider>
    );
    const { result } = renderHook(() => useWindowReferenceGridContext(), { wrapper });
    expect(result.current.tabId).toBe("TAB-001");
    expect(result.current.shouldSendOrg).toBe(false);
  });

  it("throws when used outside provider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      renderHook(() => useWindowReferenceGridContext());
    }).toThrow("useWindowReferenceGridContext must be used within WindowReferenceGridProvider");
    spy.mockRestore();
  });

  it("exposes the create-row error set and the clearCellError callback", () => {
    const createRowErrors = new Set<string>(["c_glitem_id"]);
    const clearCellError = jest.fn();
    const value = makeContextValue({ createRowErrors, clearCellError });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WindowReferenceGridProvider value={value}>{children}</WindowReferenceGridProvider>
    );
    const { result } = renderHook(() => useWindowReferenceGridContext(), { wrapper });
    expect(result.current.createRowErrors.has("c_glitem_id")).toBe(true);
    result.current.clearCellError("c_glitem_id");
    expect(clearCellError).toHaveBeenCalledWith("c_glitem_id");
  });
});
