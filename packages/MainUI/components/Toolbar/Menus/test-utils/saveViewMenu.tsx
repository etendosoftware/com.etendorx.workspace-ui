import { act, fireEvent, render, screen } from "@testing-library/react";
import type { UseSavedViewsReturn } from "@/hooks/useSavedViews";
import SaveViewMenu, { type SaveViewMenuProps } from "../SaveViewMenu";

export const SAVE_VIEW_MENU_TAB_ID = "tab-1";

/** `useSavedViews` result with no views and idle flags; `overrides` replaces any member. */
export const buildSavedViewsHookMock = (overrides: Partial<UseSavedViewsReturn> = {}): UseSavedViewsReturn => ({
  views: [],
  isLoading: false,
  isSaving: false,
  isDeleting: false,
  isUpdatingDefault: false,
  error: null,
  fetchViews: jest.fn().mockResolvedValue(undefined),
  saveView: jest.fn().mockResolvedValue(undefined),
  updateView: jest.fn().mockResolvedValue(undefined),
  setDefaultView: jest.fn(),
  unsetDefaultView: jest.fn().mockResolvedValue(undefined),
  applyView: jest.fn(),
  deleteView: jest.fn(),
  ...overrides,
});

/** Renders the open menu with an empty table state; `overrides` replaces any prop. */
export const renderSaveViewMenu = (overrides: Partial<SaveViewMenuProps> = {}) => {
  const props: SaveViewMenuProps = {
    anchorEl: document.body,
    onClose: jest.fn(),
    tabId: SAVE_VIEW_MENU_TAB_ID,
    currentFilters: [],
    currentVisibility: {},
    currentSorting: [],
    currentOrder: [],
    isImplicitFilterApplied: false,
    defaultImplicitFilterApplied: true,
    onApplyView: jest.fn(),
    ...overrides,
  };
  render(<SaveViewMenu {...props} data-testid="SaveViewMenu__f0b9a0" />);
  return props;
};

/** Saves the current view under a name through the menu form. */
export const saveCurrentView = async (name = "My view") => {
  fireEvent.click(screen.getByTestId("SaveViewMenu__save-button"));
  fireEvent.change(screen.getByTestId("SaveViewMenu__name-input"), { target: { value: name } });
  await act(async () => {
    fireEvent.click(screen.getByTestId("SaveViewMenu__confirm-save"));
  });
};

/** Goes back to the standard view through the menu. */
export const resetToStandardView = async () => {
  await act(async () => {
    fireEvent.click(screen.getByTestId("SaveViewMenu__reset-button"));
  });
};
