import { fetchGridConfiguration, saveGridConfiguration } from "@workspaceui/api-client/src/api/gridConfiguration";
import { useWindowStore } from "@/stores/windowStore";
import { FIXED_PINNED_COLUMNS } from "@/utils/table/columnState";
import type { TableState } from "@/utils/window/constants";
import {
  buildColumnConfiguration,
  clearGridConfiguration,
  GRID_CONFIGURATION_SAVE_DELAY_MS,
  loadTabColumnConfiguration,
  scheduleGridConfigurationSave,
  toColumnTableState,
} from "../gridConfiguration";

jest.mock("@workspaceui/api-client/src/api/gridConfiguration", () => ({
  fetchGridConfiguration: jest.fn(),
  saveGridConfiguration: jest.fn(),
}));

jest.mock("@/utils/logger", () => ({
  logger: { warn: jest.fn(), error: jest.fn() },
}));

const WINDOW_ID = "143";
const TAB_ID = "186";
const COLUMN = "Document No.";
const VISIBILITY = { [COLUMN]: true };
const ORDER = [COLUMN];

const mockFetch = fetchGridConfiguration as jest.Mock;
const mockSave = saveGridConfiguration as jest.Mock;

let windowSequence = 0;
/** A fresh window identifier per test, like every window the user opens. */
const nextWindowIdentifier = () => `${WINDOW_ID}_${++windowSequence}`;

const makeTable = (overrides: Partial<TableState> = {}): TableState => ({
  filters: [],
  visibility: VISIBILITY,
  sorting: [],
  order: ORDER,
  isImplicitFilterApplied: undefined,
  ...overrides,
});

describe("gridConfiguration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWindowStore.getState().cleanState();
    mockSave.mockResolvedValue({});
  });

  describe("buildColumnConfiguration / toColumnTableState", () => {
    it("omits the widths and the pinning left at their defaults", () => {
      expect(buildColumnConfiguration(makeTable({ pinning: { left: [...FIXED_PINNED_COLUMNS] } }))).toEqual({
        version: 1,
        visibility: VISIBILITY,
        order: ORDER,
      });
    });

    it("keeps the widths and only the columns the user pinned", () => {
      const table = makeTable({ sizing: { [COLUMN]: 150 }, pinning: { left: [...FIXED_PINNED_COLUMNS, COLUMN] } });

      expect(buildColumnConfiguration(table)).toEqual({
        version: 1,
        visibility: VISIBILITY,
        order: ORDER,
        sizing: { [COLUMN]: 150 },
        pinning: { left: [COLUMN] },
      });
    });

    it("resolves a stored configuration with defaults for the missing parts", () => {
      expect(toColumnTableState({ version: 1, visibility: VISIBILITY, order: ORDER })).toEqual({
        visibility: VISIBILITY,
        order: ORDER,
        sizing: {},
        pinning: { left: [...FIXED_PINNED_COLUMNS], right: [] },
      });
    });
  });

  describe("loadTabColumnConfiguration", () => {
    it("shares one request per window and returns the configuration of the tab", async () => {
      const configuration = { version: 1, visibility: VISIBILITY, order: ORDER };
      mockFetch.mockResolvedValue({ windowId: WINDOW_ID, configuration: { [TAB_ID]: configuration } });
      const windowIdentifier = nextWindowIdentifier();

      await expect(loadTabColumnConfiguration(windowIdentifier, TAB_ID)).resolves.toEqual(configuration);
      await expect(loadTabColumnConfiguration(windowIdentifier, "other-tab")).resolves.toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(WINDOW_ID);
    });

    it("behaves as nothing stored when the request fails", async () => {
      mockFetch.mockRejectedValue(new Error("boom"));

      await expect(loadTabColumnConfiguration(nextWindowIdentifier(), TAB_ID)).resolves.toBeNull();
    });
  });

  describe("scheduleGridConfigurationSave / clearGridConfiguration", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("stores the latest state of the tab once after a burst of changes", () => {
      const windowIdentifier = nextWindowIdentifier();
      const store = useWindowStore.getState();
      store.setTableVisibility(windowIdentifier, TAB_ID, VISIBILITY);
      store.setTableOrder(windowIdentifier, TAB_ID, ORDER);

      scheduleGridConfigurationSave(windowIdentifier, TAB_ID);
      store.setTableSizing(windowIdentifier, TAB_ID, { [COLUMN]: 90 });
      scheduleGridConfigurationSave(windowIdentifier, TAB_ID);
      jest.advanceTimersByTime(GRID_CONFIGURATION_SAVE_DELAY_MS);

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockSave).toHaveBeenCalledWith(WINDOW_ID, TAB_ID, {
        version: 1,
        visibility: VISIBILITY,
        order: ORDER,
        sizing: { [COLUMN]: 90 },
      });
    });

    it("skips the save when the tab is no longer open", () => {
      scheduleGridConfigurationSave(nextWindowIdentifier(), TAB_ID);
      jest.advanceTimersByTime(GRID_CONFIGURATION_SAVE_DELAY_MS);

      expect(mockSave).not.toHaveBeenCalled();
    });

    it("removes the stored configuration and drops the pending save", async () => {
      const windowIdentifier = nextWindowIdentifier();
      useWindowStore.getState().setTableOrder(windowIdentifier, TAB_ID, ORDER);
      scheduleGridConfigurationSave(windowIdentifier, TAB_ID);

      await clearGridConfiguration(windowIdentifier, TAB_ID);
      jest.advanceTimersByTime(GRID_CONFIGURATION_SAVE_DELAY_MS);

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockSave).toHaveBeenCalledWith(WINDOW_ID, TAB_ID, null);
    });

    it("logs a failed save without throwing", async () => {
      mockSave.mockRejectedValue(new Error("boom"));

      await expect(clearGridConfiguration(nextWindowIdentifier(), TAB_ID)).resolves.toBeUndefined();
    });
  });
});
