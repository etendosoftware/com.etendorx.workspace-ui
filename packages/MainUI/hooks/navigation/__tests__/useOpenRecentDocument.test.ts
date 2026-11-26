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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { useRedirect } from "@/hooks/navigation/useRedirect";
import { useRecentDocumentsStore } from "@/stores/recentDocumentsStore";
import { recordExists } from "@/utils/window/recordExists";
import { RECORD_NO_LONGER_EXISTS_MESSAGE, useOpenRecentDocument } from "../useOpenRecentDocument";

jest.mock("sonner", () => ({ toast: { warning: jest.fn() } }));
jest.mock("@/hooks/navigation/useRedirect");
jest.mock("@/utils/window/recordExists", () => ({ recordExists: jest.fn() }));
jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const CATALOG_TEXT = "The record no longer exists.";
const mockGetLabel = jest.fn();
jest.mock("@/contexts/language", () => ({ useLanguage: () => ({ getLabel: mockGetLabel }) }));

const doc = {
  recordId: "rec-1",
  identifier: "SO-001",
  windowId: "win-1",
  windowTitle: "Sales Order",
  tabId: "tab-1",
  tabLevel: 1,
  viewedAt: 1,
};

describe("useOpenRecentDocument (ETP-6431)", () => {
  const handleClickRedirect = jest.fn();
  const remove = jest.fn();
  const event = { preventDefault: jest.fn(), stopPropagation: jest.fn() } as unknown as React.MouseEvent;

  const clickDocument = async (exists: boolean) => {
    (recordExists as jest.Mock).mockResolvedValue(exists);
    const { result } = renderHook(() => useOpenRecentDocument());
    await act(() => result.current(event, doc));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRedirect as jest.Mock).mockReturnValue({ handleClickRedirect });
    useRecentDocumentsStore.setState({ remove });
    mockGetLabel.mockImplementation((code: string) => (code === RECORD_NO_LONGER_EXISTS_MESSAGE ? CATALOG_TEXT : code));
  });

  it("opens an existing record on its tab, as before", async () => {
    await clickDocument(true);

    expect(recordExists).toHaveBeenCalledWith({ windowId: doc.windowId, tabId: doc.tabId, recordId: doc.recordId });
    expect(handleClickRedirect).toHaveBeenCalledWith({
      e: event,
      windowId: doc.windowId,
      windowTitle: doc.windowTitle,
      referencedTabId: doc.tabId,
      selectedRecordId: doc.recordId,
      tabLevel: doc.tabLevel,
    });
    expect(toast.warning).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("tells the user, opens nothing and drops the document when the record was deleted", async () => {
    await clickDocument(false);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(handleClickRedirect).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith(CATALOG_TEXT);
    expect(remove).toHaveBeenCalledWith(doc.tabId, doc.recordId);
  });

  it("falls back to the local text when the message is not in the catalog", async () => {
    mockGetLabel.mockImplementation((code: string) => code);

    await clickDocument(false);

    expect(toast.warning).toHaveBeenCalledWith("dashboard.recentDocuments.recordNoLongerExists");
  });
});
