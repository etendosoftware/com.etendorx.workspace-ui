import {
  renderSaveViewMenu,
  resetToStandardView,
  SAVE_VIEW_MENU_TAB_ID,
  saveCurrentView,
} from "../test-utils/saveViewMenu";

const mockSaveView = jest.fn().mockResolvedValue(undefined);
const mockUnsetDefaultView = jest.fn().mockResolvedValue(undefined);

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@/hooks/useSavedViews", () => ({
  useSavedViews: () =>
    jest.requireActual("../test-utils/saveViewMenu").buildSavedViewsHookMock({
      saveView: mockSaveView,
      unsetDefaultView: mockUnsetDefaultView,
    }),
}));

const TAB_ID = SAVE_VIEW_MENU_TAB_ID;
const GROUPED_COLUMN = "Business Partner";
const renderMenu = renderSaveViewMenu;

describe("SaveViewMenu grouping", () => {
  beforeEach(() => jest.clearAllMocks());

  it("saves the current grouping with the view", async () => {
    renderMenu({ currentGrouping: [GROUPED_COLUMN] });

    await saveCurrentView();

    expect(mockSaveView).toHaveBeenCalledWith(expect.objectContaining({ tabId: TAB_ID, grouping: [GROUPED_COLUMN] }));
  });

  it("saves an empty grouping when the grid is not grouped", async () => {
    renderMenu();

    await saveCurrentView();

    expect(mockSaveView).toHaveBeenCalledWith(expect.objectContaining({ grouping: [] }));
  });

  it("ungroups when resetting to the standard view", async () => {
    const props = renderMenu({ currentGrouping: [GROUPED_COLUMN] });

    await resetToStandardView();

    expect(mockUnsetDefaultView).toHaveBeenCalledWith(TAB_ID);
    expect(props.onApplyView).toHaveBeenCalledWith(expect.objectContaining({ grouping: [] }));
  });
});
