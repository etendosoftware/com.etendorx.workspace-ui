import { renderHook } from "@testing-library/react";
import type { Field, Tab } from "@workspaceui/api-client/src/api/types";
import { usePersonalizedTab } from "../usePersonalizedTab";

let personalization: { form: { fields: Array<Record<string, unknown>> } } | null;
jest.mock("@/hooks/useFormPersonalization", () => ({
  useFormPersonalization: () => ({ personalization }),
}));

const field = (hqlName: string, sequenceNumber: number): Field =>
  ({ id: hqlName, hqlName, displayed: true, sequenceNumber, shownInStatusBar: false }) as unknown as Field;

const tab = { id: "tab", fields: { a: field("a", 10), b: field("b", 20) } } as unknown as Tab;

describe("usePersonalizedTab", () => {
  it("returns the very same tab when there is no personalization", () => {
    personalization = null;

    const { result } = renderHook(() => usePersonalizedTab(tab));

    expect(result.current).toBe(tab);
  });

  it("returns the same tab when the personalization has nothing to apply", () => {
    personalization = { form: { fields: [] } };

    const { result } = renderHook(() => usePersonalizedTab(tab));

    expect(result.current).toBe(tab);
  });

  it("applies the personalization to the fields without touching the rest of the tab", () => {
    personalization = { form: { fields: [{ name: "b" }, { name: "a", hiddenInForm: true }] } };

    const { result } = renderHook(() => usePersonalizedTab(tab));

    expect(result.current).not.toBe(tab);
    expect(result.current.id).toBe("tab");
    expect(result.current.fields.a.displayed).toBe(false);
    expect(result.current.fields.b.sequenceNumber).toBeLessThan(result.current.fields.a.sequenceNumber as number);
    expect(tab.fields.a.displayed).toBe(true);
  });

  it("keeps the result while the tab and the personalization do not change", () => {
    personalization = { form: { fields: [{ name: "a", colSpan: 2 }] } };

    const { result, rerender } = renderHook(() => usePersonalizedTab(tab));
    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });
});
