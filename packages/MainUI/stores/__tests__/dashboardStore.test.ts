import { useDashboardStore, WIDGET_PAGE_SIZE } from "../dashboardStore";
import {
  fetchDashboardLayout,
  fetchWidgetData,
  fetchWidgetClasses,
  updateDashboardLayout,
  addDashboardWidget,
  deleteDashboardWidget,
  updateWidgetParams,
} from "@workspaceui/api-client/src/api/dashboard";

jest.mock("@workspaceui/api-client/src/api/dashboard");
jest.mock("@/utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockFetchLayout = fetchDashboardLayout as jest.MockedFunction<typeof fetchDashboardLayout>;
const mockFetchWidgetData = fetchWidgetData as jest.MockedFunction<typeof fetchWidgetData>;
const mockFetchClasses = fetchWidgetClasses as jest.MockedFunction<typeof fetchWidgetClasses>;
const mockUpdateLayout = updateDashboardLayout as jest.MockedFunction<typeof updateDashboardLayout>;
const mockAddWidget = addDashboardWidget as jest.MockedFunction<typeof addDashboardWidget>;
const mockDeleteWidget = deleteDashboardWidget as jest.MockedFunction<typeof deleteDashboardWidget>;
const mockUpdateParams = updateWidgetParams as jest.MockedFunction<typeof updateWidgetParams>;

const makeWidget = (id: string, refreshInterval = 0) =>
  ({
    instanceId: id,
    widgetClassId: "kpi",
    title: `Widget ${id}`,
    position: { col: 0, row: 0, width: 4, height: 2 },
    refreshInterval,
    parameters: {},
  }) as any;

const makeData = (label: string) => ({ type: "KPI", value: label }) as any;

describe("dashboardStore", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useDashboardStore.getState().resetForRole("test-role");
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Drain pending timers and reset to avoid bleed between tests.
    useDashboardStore.getState().resetForRole("cleanup");
    jest.useRealTimers();
  });

  describe("initial state", () => {
    it("starts empty after resetForRole(null)", () => {
      useDashboardStore.setState({ loadedRoleId: null });
      const s = useDashboardStore.getState();
      expect(s.layout).toEqual([]);
      expect(s.widgetData).toEqual({});
      expect(s.widgetErrors).toEqual({});
      expect(s.widgetClasses).toEqual([]);
      expect(s.isLoadingLayout).toBe(false);
      expect(s.layoutError).toBeNull();
    });
  });

  describe("resetForRole", () => {
    it("clears state and remembers the new role", async () => {
      mockFetchLayout.mockResolvedValue({ widgets: [makeWidget("w1")] } as any);
      mockFetchWidgetData.mockResolvedValue(makeData("d1"));
      await useDashboardStore.getState().loadLayout();

      expect(useDashboardStore.getState().layout).toHaveLength(1);

      useDashboardStore.getState().resetForRole("new-role");
      const s = useDashboardStore.getState();
      expect(s.layout).toEqual([]);
      expect(s.widgetData).toEqual({});
      expect(s.loadedRoleId).toBe("new-role");
    });
  });

  describe("loadLayout", () => {
    it("populates layout and widget data on success", async () => {
      mockFetchLayout.mockResolvedValue({
        widgets: [makeWidget("w1"), makeWidget("w2")],
      } as any);
      mockFetchWidgetData.mockImplementation(async (id) => makeData(id));

      await useDashboardStore.getState().loadLayout();

      const s = useDashboardStore.getState();
      expect(s.layout).toHaveLength(2);
      expect(s.widgetData.w1).toEqual(makeData("w1"));
      expect(s.widgetData.w2).toEqual(makeData("w2"));
      expect(s.isLoadingLayout).toBe(false);
      expect(s.layoutError).toBeNull();
    });

    it("toggles isLoadingLayout during fetch", async () => {
      let resolve!: (v: any) => void;
      mockFetchLayout.mockReturnValue(
        new Promise((r) => {
          resolve = r;
        }) as any
      );

      const pending = useDashboardStore.getState().loadLayout();
      expect(useDashboardStore.getState().isLoadingLayout).toBe(true);

      resolve({ widgets: [] });
      await pending;
      expect(useDashboardStore.getState().isLoadingLayout).toBe(false);
    });

    it("sets layoutError when fetchDashboardLayout throws", async () => {
      mockFetchLayout.mockRejectedValue(new Error("boom"));
      await useDashboardStore.getState().loadLayout();
      const s = useDashboardStore.getState();
      expect(s.layoutError).toBe("boom");
      expect(s.isLoadingLayout).toBe(false);
    });

    it("records widget error without crashing layout when fetchWidgetData fails", async () => {
      mockFetchLayout.mockResolvedValue({ widgets: [makeWidget("w1"), makeWidget("w2")] } as any);
      mockFetchWidgetData.mockImplementation(async (id) => {
        if (id === "w2") throw new Error("widget down");
        return makeData(id);
      });

      await useDashboardStore.getState().loadLayout();

      const s = useDashboardStore.getState();
      expect(s.layout).toHaveLength(2);
      expect(s.widgetData.w1).toEqual(makeData("w1"));
      expect(s.widgetData.w2).toBeUndefined();
      expect(s.widgetErrors.w2).toBe("widget down");
    });

    it("schedules auto-refresh per widget refreshInterval", async () => {
      mockFetchLayout.mockResolvedValue({
        widgets: [makeWidget("w1", 30), makeWidget("w2", 0)],
      } as any);
      mockFetchWidgetData.mockResolvedValue(makeData("x"));

      await useDashboardStore.getState().loadLayout();
      mockFetchWidgetData.mockClear();

      jest.advanceTimersByTime(30_000);
      // Drain microtasks from the interval callback.
      await Promise.resolve();
      await Promise.resolve();

      expect(mockFetchWidgetData).toHaveBeenCalledWith("w1", { page: 1, pageSize: WIDGET_PAGE_SIZE });
      // w2 has refreshInterval=0 → not scheduled.
      expect(mockFetchWidgetData).toHaveBeenCalledTimes(1);
    });
  });

  describe("silentRefreshLayout", () => {
    it("does not toggle isLoadingLayout", async () => {
      let resolve!: (v: any) => void;
      mockFetchLayout.mockReturnValue(
        new Promise((r) => {
          resolve = r;
        }) as any
      );

      const pending = useDashboardStore.getState().silentRefreshLayout();
      expect(useDashboardStore.getState().isLoadingLayout).toBe(false);

      resolve({ widgets: [] });
      await pending;
      expect(useDashboardStore.getState().isLoadingLayout).toBe(false);
    });
  });

  describe("loadWidgetClasses", () => {
    it("populates widgetClasses on success", async () => {
      mockFetchClasses.mockResolvedValue({ classes: [{ widgetClassId: "kpi" } as any] });
      await useDashboardStore.getState().loadWidgetClasses();
      expect(useDashboardStore.getState().widgetClasses).toHaveLength(1);
      expect(useDashboardStore.getState().classesError).toBeNull();
    });

    it("sets classesError on failure", async () => {
      mockFetchClasses.mockRejectedValue(new Error("nope"));
      await useDashboardStore.getState().loadWidgetClasses();
      expect(useDashboardStore.getState().classesError).toBe("nope");
      expect(useDashboardStore.getState().isLoadingClasses).toBe(false);
    });
  });

  describe("refreshWidget", () => {
    it("updates only that widget's data slot", async () => {
      useDashboardStore.setState({
        widgetData: { w1: makeData("old1"), w2: makeData("keep") },
      });
      mockFetchWidgetData.mockResolvedValue(makeData("new1"));

      await useDashboardStore.getState().refreshWidget("w1");

      const data = useDashboardStore.getState().widgetData;
      expect(data.w1).toEqual(makeData("new1"));
      expect(data.w2).toEqual(makeData("keep"));
    });

    it("clears a previous widgetError on a successful retry", async () => {
      useDashboardStore.setState({ widgetErrors: { w1: "stale" } });
      mockFetchWidgetData.mockResolvedValue(makeData("ok"));

      await useDashboardStore.getState().refreshWidget("w1");

      expect(useDashboardStore.getState().widgetErrors.w1).toBeUndefined();
    });
  });

  describe("updateLayout", () => {
    it("applies optimistic position updates", async () => {
      useDashboardStore.setState({ layout: [makeWidget("w1"), makeWidget("w2")] });
      mockUpdateLayout.mockResolvedValue(undefined as any);

      await useDashboardStore.getState().updateLayout([{ instanceId: "w1", col: 5, row: 5, width: 3, height: 3 }]);

      const layout = useDashboardStore.getState().layout;
      expect(layout[0].position).toEqual({ col: 5, row: 5, width: 3, height: 3 });
      expect(layout[1].position).toEqual({ col: 0, row: 0, width: 4, height: 2 });
    });

    it("keeps optimistic state on PUT failure (no destructive refetch)", async () => {
      useDashboardStore.setState({ layout: [makeWidget("w1")] });
      mockUpdateLayout.mockRejectedValue(new Error("server"));

      await useDashboardStore.getState().updateLayout([{ instanceId: "w1", col: 9, row: 9, width: 1, height: 1 }]);

      expect(useDashboardStore.getState().layout[0].position).toEqual({ col: 9, row: 9, width: 1, height: 1 });
      expect(mockFetchLayout).not.toHaveBeenCalled();
    });
  });

  describe("addWidget", () => {
    it("performs a full reload after adding", async () => {
      mockAddWidget.mockResolvedValue(undefined as any);
      mockFetchLayout.mockResolvedValue({ widgets: [makeWidget("new")] } as any);
      mockFetchWidgetData.mockResolvedValue(makeData("new"));

      await useDashboardStore.getState().addWidget({ widgetClassId: "kpi" } as any);

      expect(mockAddWidget).toHaveBeenCalledTimes(1);
      expect(mockFetchLayout).toHaveBeenCalledTimes(1);
      expect(useDashboardStore.getState().layout).toHaveLength(1);
    });
  });

  describe("removeWidget", () => {
    it("removes optimistically and drops widget data", async () => {
      useDashboardStore.setState({
        layout: [makeWidget("w1"), makeWidget("w2")],
        widgetData: { w1: makeData("a"), w2: makeData("b") },
      });
      mockDeleteWidget.mockResolvedValue(undefined as any);

      await useDashboardStore.getState().removeWidget("w1");

      const s = useDashboardStore.getState();
      expect(s.layout.map((w) => w.instanceId)).toEqual(["w2"]);
      expect(s.widgetData.w1).toBeUndefined();
      expect(s.widgetData.w2).toBeDefined();
    });

    it("falls back to silentRefreshLayout when DELETE fails", async () => {
      useDashboardStore.setState({ layout: [makeWidget("w1")], widgetData: { w1: makeData("a") } });
      mockDeleteWidget.mockRejectedValue(new Error("nope"));
      mockFetchLayout.mockResolvedValue({ widgets: [makeWidget("w1")] } as any);
      mockFetchWidgetData.mockResolvedValue(makeData("a"));

      await useDashboardStore.getState().removeWidget("w1");

      expect(mockFetchLayout).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateParams", () => {
    it("persists params and re-fetches the widget", async () => {
      mockUpdateParams.mockResolvedValue(undefined as any);
      mockFetchWidgetData.mockResolvedValue(makeData("refreshed"));

      await useDashboardStore.getState().updateParams("w1", { foo: "bar" });

      expect(mockUpdateParams).toHaveBeenCalledWith("w1", { foo: "bar" });
      expect(mockFetchWidgetData).toHaveBeenCalledWith("w1", { page: 1, pageSize: WIDGET_PAGE_SIZE });
      expect(useDashboardStore.getState().widgetData.w1).toEqual(makeData("refreshed"));
    });
  });
});
