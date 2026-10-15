import { act, fireEvent, render, screen } from "@testing-library/react";
import SaveViewMenu, { type SaveViewMenuProps } from "../SaveViewMenu";

const mockSaveView = jest.fn().mockResolvedValue(undefined);
const mockUnsetDefaultView = jest.fn().mockResolvedValue(undefined);

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@/hooks/useSavedViews", () => ({
  useSavedViews: () => ({
    views: [],
    isLoading: false,
    isSaving: false,
    isDeleting: false,
    isUpdatingDefault: false,
    fetchViews: jest.fn().mockResolvedValue(undefined),
    saveView: mockSaveView,
    setDefaultView: jest.fn(),
    unsetDefaultView: mockUnsetDefaultView,
    applyView: jest.fn(),
    deleteView: jest.fn(),
  }),
}));

const TAB_ID = "tab-1";
const GROUPED_COLUMN = "Business Partner";

/** Renders the open menu with an empty table state; `overrides` replaces any prop. */
const renderMenu = (overrides: Partial<SaveViewMenuProps> = {}) => {
  const props: SaveViewMenuProps = {
    anchorEl: document.body,
    onClose: jest.fn(),
    tabId: TAB_ID,
    currentFilters: [],
    currentVisibility: {},
    currentSorting: [],
    currentOrder: [],
    isImplicitFilterApplied: false,
    defaultImplicitFilterApplied: true,
    onApplyView: jest.fn(),
    ...overrides,
  };
  render(<SaveViewMenu {...props} />);
  return props;
};

/** Saves the current view under a name through the menu form. */
const saveCurrentView = async () => {
  fireEvent.click(screen.getByTestId("SaveViewMenu__save-button"));
  fireEvent.change(screen.getByTestId("SaveViewMenu__name-input"), { target: { value: "My view" } });
  await act(async () => {
    fireEvent.click(screen.getByTestId("SaveViewMenu__confirm-save"));
  });
};

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

    await act(async () => {
      fireEvent.click(screen.getByTestId("SaveViewMenu__reset-button"));
    });

    expect(mockUnsetDefaultView).toHaveBeenCalledWith(TAB_ID);
    expect(props.onApplyView).toHaveBeenCalledWith(expect.objectContaining({ grouping: [] }));
  });
});
