import { render, renderHook } from "@testing-library/react";
import React from "react";
import { WindowReferenceGridProvider, useWindowReferenceGridContext } from "../WindowReferenceGridContext";
import "@testing-library/jest-dom";

const makeContextValue = () => ({
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
});
