import { DEFAULT_COLUMN_PINNING } from "@/utils/table/columnState";
import {
  renderSaveViewMenu,
  resetToStandardView,
  SAVE_VIEW_MENU_TAB_ID,
  saveCurrentView,
} from "../test-utils/saveViewMenu";

const EXISTING_VIEW = { id: "view-1", name: "Wide columns", tabId: SAVE_VIEW_MENU_TAB_ID, isDefault: false };

const mockSaveView = jest.fn().mockResolvedValue(undefined);
const mockUpdateView = jest.fn().mockResolvedValue(undefined);
const mockUnsetDefaultView = jest.fn().mockResolvedValue(undefined);

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@/hooks/useSavedViews", () => ({
  useSavedViews: () =>
    jest.requireActual("../test-utils/saveViewMenu").buildSavedViewsHookMock({
      views: [{ ...EXISTING_VIEW, filterClause: "", config: null }],
      saveView: mockSaveView,
      updateView: mockUpdateView,
      unsetDefaultView: mockUnsetDefaultView,
    }),
}));

const COLUMN = "Document No.";
const COLUMN_STATE = {
  currentSizing: { [COLUMN]: 150 },
  currentPinning: { left: ["mrt-row-select", "actions", COLUMN], right: [] },
  currentLayout: { splitHeights: { "1": 30 }, maximizedLevel: 1 },
  currentSummaries: { [COLUMN]: "sum" as const },
};

describe("SaveViewMenu widths, pinning, layout and summaries", () => {
  beforeEach(() => jest.clearAllMocks());

  it("saves the widths, the pinning, the window layout and the summaries with a new view", async () => {
    renderSaveViewMenu(COLUMN_STATE);

    await saveCurrentView();

    expect(mockSaveView).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "My view",
        sizing: COLUMN_STATE.currentSizing,
        pinning: COLUMN_STATE.currentPinning,
        layout: COLUMN_STATE.currentLayout,
        summaries: COLUMN_STATE.currentSummaries,
      })
    );
    expect(mockUpdateView).not.toHaveBeenCalled();
  });

  it("overwrites the view saved under the same name", async () => {
    renderSaveViewMenu(COLUMN_STATE);

    await saveCurrentView(EXISTING_VIEW.name);

    expect(mockUpdateView).toHaveBeenCalledWith(
      EXISTING_VIEW.id,
      expect.objectContaining({ sizing: COLUMN_STATE.currentSizing, layout: COLUMN_STATE.currentLayout })
    );
    expect(mockSaveView).not.toHaveBeenCalled();
  });

  it("restores the default widths, pinning and layout and clears the stored columns on reset", async () => {
    const onResetToStandard = jest.fn();
    const props = renderSaveViewMenu({ ...COLUMN_STATE, onResetToStandard });

    await resetToStandardView();

    const standardState = (props.onApplyView as jest.Mock).mock.calls[0][0];
    expect(standardState).toMatchObject({ visibility: {}, sizing: {}, pinning: DEFAULT_COLUMN_PINNING, summaries: {} });
    expect(standardState).not.toHaveProperty("layout");
    expect(onResetToStandard).toHaveBeenCalledTimes(1);
  });
});
