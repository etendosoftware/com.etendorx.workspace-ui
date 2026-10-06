/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { fetchLinkedItemCategories, fetchLinkedItems } from "@workspaceui/api-client/src/api/linkedItems";
import { LinkedItemsSection } from "../LinkedItemsSection";

const WINDOW_ID = "window-1";
const ENTITY_NAME = "BusinessPartner";
const RECORD_A = "record-a";
const RECORD_B = "record-b";

const CATEGORY = {
  adTabId: "tab-1",
  adWindowId: WINDOW_ID,
  columnName: "C_BPartner_ID",
  fullElementName: "Sales Order - Business Partner",
  tableName: "C_Order",
  total: "1",
};

const ITEM = { adTabId: "tab-2", adWindowId: "window-2", adMenuName: "Sales Order", id: "order-1", name: "SO-001" };

const mockReplace = jest.fn();
const mockTriggerRecovery = jest.fn();
const mockState = { isFormInitializing: false, isSessionSyncLoading: false, isRecoveryLoading: false };

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@workspaceui/api-client/src/api/linkedItems", () => ({
  fetchLinkedItemCategories: jest.fn(),
  fetchLinkedItems: jest.fn(),
}));

jest.mock("@/stores/windowStore", () => ({
  useWindowStore: (selector: (s: unknown) => unknown) =>
    selector({ triggerRecovery: mockTriggerRecovery, isRecoveryLoading: mockState.isRecoveryLoading }),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (s: unknown) => unknown) =>
    selector({ isSessionSyncLoading: mockState.isSessionSyncLoading }),
}));

jest.mock("@/contexts/CurrentWindowContext", () => ({
  useCurrentWindowId: () => WINDOW_ID,
}));

jest.mock("@/contexts/FormInitializationContext", () => ({
  useFormInitializationContext: () => ({ isFormInitializing: mockState.isFormInitializing }),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/utils/window/utils", () => ({
  getNewWindowIdentifier: (windowId: string) => `${windowId}_new`,
}));

jest.mock("@/utils/url/utils", () => ({
  appendWindowToUrl: () => "wi_0=window-2_new",
}));

const mockFetchCategories = fetchLinkedItemCategories as jest.Mock;
const mockFetchItems = fetchLinkedItems as jest.Mock;

const sectionElement = (isSectionExpanded: boolean, recordId = RECORD_A) => (
  <LinkedItemsSection
    tabId="tab-0"
    entityName={ENTITY_NAME}
    recordId={recordId}
    isSectionExpanded={isSectionExpanded}
  />
);

const renderSection = (isSectionExpanded: boolean, recordId = RECORD_A) =>
  render(sectionElement(isSectionExpanded, recordId));

/** Lets pending effects and promise callbacks settle before asserting a negative. */
const flushEffects = () => waitFor(() => Promise.resolve());

describe("LinkedItemsSection lazy loading", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockState, { isFormInitializing: false, isSessionSyncLoading: false, isRecoveryLoading: false });
    mockFetchCategories.mockResolvedValue([CATEGORY]);
    mockFetchItems.mockResolvedValue([ITEM]);
  });

  it("does not request categories while the section has never been expanded", async () => {
    renderSection(false);
    await flushEffects();
    expect(mockFetchCategories).not.toHaveBeenCalled();
  });

  it("requests categories the first time the section is expanded", async () => {
    const { rerender } = renderSection(false);
    rerender(sectionElement(true));
    await waitFor(() => expect(mockFetchCategories).toHaveBeenCalledTimes(1));
    expect(mockFetchCategories).toHaveBeenCalledWith({
      windowId: WINDOW_ID,
      entityName: ENTITY_NAME,
      recordId: RECORD_A,
    });
  });

  it("does not request categories again when the section is collapsed and re-expanded", async () => {
    const { rerender } = renderSection(true);
    await waitFor(() => expect(mockFetchCategories).toHaveBeenCalledTimes(1));
    rerender(sectionElement(false));
    rerender(sectionElement(true));
    await flushEffects();
    expect(mockFetchCategories).toHaveBeenCalledTimes(1);
  });

  it("requests the new record categories only when expanded after a record change", async () => {
    const { rerender } = renderSection(true);
    await waitFor(() => expect(mockFetchCategories).toHaveBeenCalledTimes(1));
    rerender(sectionElement(false));
    rerender(sectionElement(false, RECORD_B));
    await flushEffects();
    expect(mockFetchCategories).toHaveBeenCalledTimes(1);

    rerender(sectionElement(true, RECORD_B));
    await waitFor(() => expect(mockFetchCategories).toHaveBeenCalledTimes(2));
    expect(mockFetchCategories).toHaveBeenLastCalledWith({
      windowId: WINDOW_ID,
      entityName: ENTITY_NAME,
      recordId: RECORD_B,
    });
  });

  it.each([
    ["the form is initializing", { isFormInitializing: true }],
    ["the session is syncing", { isSessionSyncLoading: true }],
  ])("does not request categories while %s even if expanded", async (_label, state) => {
    Object.assign(mockState, state);
    renderSection(true);
    await flushEffects();
    expect(mockFetchCategories).not.toHaveBeenCalled();
  });
});

describe("LinkedItemsSection item click", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockState, { isFormInitializing: false, isSessionSyncLoading: false, isRecoveryLoading: false });
    mockFetchCategories.mockResolvedValue([CATEGORY]);
    mockFetchItems.mockResolvedValue([ITEM]);
  });

  const openItem = async () => {
    renderSection(true);
    fireEvent.click(await screen.findByText(CATEGORY.fullElementName));
    fireEvent.click(await screen.findByText(ITEM.name));
  };

  it("opens the linked item in a new window through URL recovery", async () => {
    await openItem();
    expect(mockTriggerRecovery).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("window?wi_0=window-2_new");
  });

  it("ignores the click while a recovery is in progress", async () => {
    mockState.isRecoveryLoading = true;
    await openItem();
    expect(mockTriggerRecovery).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
