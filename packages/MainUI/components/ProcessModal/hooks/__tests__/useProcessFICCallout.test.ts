import { renderHook, act } from "@testing-library/react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { useProcessFICCallout } from "../useProcessFICCallout";
import type { UseFormReturn } from "react-hook-form";

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: { kernelClient: { post: jest.fn() } },
}));

jest.mock("@/utils/logger", () => ({
  logger: { warn: jest.fn(), debug: jest.fn() },
}));

const mockPost = Metadata.kernelClient.post as jest.Mock;

function makeForm(values: Record<string, unknown>): UseFormReturn<Record<string, unknown>> {
  return {
    watch: jest.fn(() => values),
    getValues: jest.fn(() => values),
  } as unknown as UseFormReturn<Record<string, unknown>>;
}

const PARAMS = {
  p1: { id: "p1", name: "field1", dBColumnName: "dbCol1" },
};

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    tabId: "tab-123",
    parameters: PARAMS as any,
    form: makeForm({ field1: "initial" }),
    enabled: true,
    onCalloutResponse: jest.fn(),
    ...overrides,
  };
}

type HookProps = ReturnType<typeof baseProps>;

describe("useProcessFICCallout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPost.mockReset();
    mockPost.mockResolvedValue({ data: null });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initial mount", () => {
    it("does not fire callout on initial mount", async () => {
      renderHook(() => useProcessFICCallout(baseProps()));

      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  describe("guard conditions", () => {
    it("does not fire callout when enabled is false", async () => {
      const props = baseProps({ enabled: false, form: makeForm({ field1: "init" }) });
      const { rerender } = renderHook(({ p }: { p: HookProps }) => useProcessFICCallout(p), {
        initialProps: { p: props },
      });

      await act(async () => jest.advanceTimersByTime(400));

      rerender({ p: { ...props, form: makeForm({ field1: "changed" }) } });
      await act(async () => jest.advanceTimersByTime(400));

      expect(mockPost).not.toHaveBeenCalled();
    });

    it("does not fire callout when tabId is empty", async () => {
      const props = baseProps({ tabId: "", form: makeForm({ field1: "init" }) });
      const { rerender } = renderHook(({ p }: { p: HookProps }) => useProcessFICCallout(p), {
        initialProps: { p: props },
      });

      await act(async () => jest.advanceTimersByTime(400));

      rerender({ p: { ...props, form: makeForm({ field1: "changed" }) } });
      await act(async () => jest.advanceTimersByTime(400));

      expect(mockPost).not.toHaveBeenCalled();
    });

    it("does not fire callout when changed field has no matching parameter", async () => {
      const props = baseProps({ form: makeForm({ unknownField: "init" }) });
      const { rerender } = renderHook(({ p }: { p: HookProps }) => useProcessFICCallout(p), {
        initialProps: { p: props },
      });

      await act(async () => jest.advanceTimersByTime(400));

      rerender({ p: { ...props, form: makeForm({ unknownField: "changed" }) } });
      await act(async () => jest.advanceTimersByTime(400));

      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  describe("callout execution", () => {
    it("fires callout after debounce when a field value changes", async () => {
      mockPost.mockResolvedValue({
        data: { columnValues: { dbCol1: { value: "new" } }, dynamicCols: [] },
      });

      const props = baseProps({ form: makeForm({ field1: "init" }) });
      const { rerender } = renderHook(({ p }: { p: HookProps }) => useProcessFICCallout(p), {
        initialProps: { p: props },
      });

      await act(async () => jest.advanceTimersByTime(400));

      rerender({ p: { ...props, form: makeForm({ field1: "changed" }) } });
      await act(async () => jest.advanceTimersByTime(400));

      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it("calls onCalloutResponse with parsed columnValues and dynamicCols", async () => {
      const onCalloutResponse = jest.fn();
      mockPost.mockResolvedValue({
        data: {
          columnValues: { col: { value: "v", classicValue: "cv", identifier: "id" } },
          dynamicCols: ["col"],
          auxiliaryInputValues: { aux: { value: "a", classicValue: "ac" } },
        },
      });

      const props = baseProps({ form: makeForm({ field1: "init" }), onCalloutResponse });
      const { rerender } = renderHook(({ p }: { p: HookProps }) => useProcessFICCallout(p), {
        initialProps: { p: props },
      });

      await act(async () => jest.advanceTimersByTime(400));
      rerender({ p: { ...props, form: makeForm({ field1: "updated" }) } });
      await act(async () => jest.advanceTimersByTime(400));

      expect(onCalloutResponse).toHaveBeenCalledWith({
        columnValues: { col: { value: "v", classicValue: "cv", identifier: "id" } },
        dynamicCols: ["col"],
        auxiliaryInputValues: { aux: { value: "a", classicValue: "ac" } },
      });
    });

    it("handles response wrapped in response envelope", async () => {
      const onCalloutResponse = jest.fn();
      mockPost.mockResolvedValue({
        data: {
          response: {
            columnValues: { col: { value: "v" } },
            dynamicCols: ["col"],
          },
        },
      });

      const props = baseProps({ form: makeForm({ field1: "init" }), onCalloutResponse });
      const { rerender } = renderHook(({ p }: { p: HookProps }) => useProcessFICCallout(p), {
        initialProps: { p: props },
      });

      await act(async () => jest.advanceTimersByTime(400));
      rerender({ p: { ...props, form: makeForm({ field1: "updated" }) } });
      await act(async () => jest.advanceTimersByTime(400));

      expect(onCalloutResponse).toHaveBeenCalledWith({
        columnValues: { col: { value: "v" } },
        dynamicCols: ["col"],
        auxiliaryInputValues: undefined,
      });
    });

    it("does not call onCalloutResponse when response has no columnValues", async () => {
      const onCalloutResponse = jest.fn();
      mockPost.mockResolvedValue({ data: { someOtherData: true } });

      const props = baseProps({ form: makeForm({ field1: "init" }), onCalloutResponse });
      const { rerender } = renderHook(({ p }: { p: HookProps }) => useProcessFICCallout(p), {
        initialProps: { p: props },
      });

      await act(async () => jest.advanceTimersByTime(400));
      rerender({ p: { ...props, form: makeForm({ field1: "changed" }) } });
      await act(async () => jest.advanceTimersByTime(400));

      expect(mockPost).toHaveBeenCalled();
      expect(onCalloutResponse).not.toHaveBeenCalled();
    });

    it("sends inp-prefixed column name derived from parameter dBColumnName", async () => {
      const changedValues = { field1: "newValue" };
      const newForm = makeForm({ field1: "newValue" });
      newForm.getValues = jest.fn(() => changedValues) as any;

      const props = baseProps({ form: makeForm({ field1: "init" }) });
      const { rerender } = renderHook(({ p }: { p: HookProps }) => useProcessFICCallout(p), {
        initialProps: { p: props },
      });

      await act(async () => jest.advanceTimersByTime(400));
      rerender({ p: { ...props, form: newForm } });
      await act(async () => jest.advanceTimersByTime(400));

      expect(mockPost).toHaveBeenCalled();
      const payload = mockPost.mock.calls[0][1] as Record<string, unknown>;
      expect(payload).toHaveProperty("inpdbCol1", "newValue");
    });

    it("includes TAB_ID, CHANGED_COLUMN and MODE=CHANGE in the request URL", async () => {
      const props = baseProps({ tabId: "my-tab", form: makeForm({ field1: "init" }) });
      const { rerender } = renderHook(({ p }: { p: HookProps }) => useProcessFICCallout(p), {
        initialProps: { p: props },
      });

      await act(async () => jest.advanceTimersByTime(400));
      rerender({ p: { ...props, form: makeForm({ field1: "updated" }) } });
      await act(async () => jest.advanceTimersByTime(400));

      const url = mockPost.mock.calls[0][0] as string;
      expect(url).toContain("TAB_ID=my-tab");
      expect(url).toContain("CHANGED_COLUMN=dbCol1");
      expect(url).toContain("MODE=CHANGE");
    });

    it("uses form field name as column key when no matching parameter is found for other fields", async () => {
      const paramsWithExtra = {
        ...PARAMS,
        p2: { id: "p2", name: "field2", dBColumnName: "dbCol2" },
      };
      const changedValues = { field1: "v1", field2: "v2" };
      const newForm = makeForm({ field1: "v1", field2: "v2" });
      newForm.getValues = jest.fn(() => changedValues) as any;

      const props = baseProps({
        parameters: paramsWithExtra as any,
        form: makeForm({ field1: "init", field2: "init2" }),
      });
      const { rerender } = renderHook(({ p }: { p: HookProps }) => useProcessFICCallout(p), {
        initialProps: { p: props },
      });

      await act(async () => jest.advanceTimersByTime(400));
      rerender({ p: { ...props, form: newForm } });
      await act(async () => jest.advanceTimersByTime(400));

      const payload = mockPost.mock.calls[0][1] as Record<string, unknown>;
      expect(payload).toHaveProperty("inpdbCol1");
      expect(payload).toHaveProperty("inpdbCol2");
    });
  });

  describe("error handling", () => {
    it("handles API errors gracefully without throwing", async () => {
      mockPost.mockRejectedValue(new Error("Network error"));

      const props = baseProps({ form: makeForm({ field1: "init" }) });
      const { rerender } = renderHook(({ p }: { p: HookProps }) => useProcessFICCallout(p), {
        initialProps: { p: props },
      });

      await act(async () => jest.advanceTimersByTime(400));
      rerender({ p: { ...props, form: makeForm({ field1: "changed" }) } });

      await expect(act(async () => jest.advanceTimersByTime(400))).resolves.not.toThrow();
      expect(mockPost).toHaveBeenCalled();
    });
  });

  describe("debounce behavior", () => {
    it("does not fire callout before debounce interval elapses", async () => {
      const props = baseProps({ form: makeForm({ field1: "init" }) });
      const { rerender } = renderHook(({ p }: { p: HookProps }) => useProcessFICCallout(p), {
        initialProps: { p: props },
      });

      await act(async () => jest.advanceTimersByTime(400));

      rerender({ p: { ...props, form: makeForm({ field1: "changed" }) } });

      await act(async () => jest.advanceTimersByTime(200));

      expect(mockPost).not.toHaveBeenCalled();
    });
  });
});
