/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance
 * with the License.
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

import { useRecentDocumentsStore } from "@/stores/recentDocumentsStore";
import { fetchRecentDocuments, trackRecentDocument } from "@workspaceui/api-client/src/api/dashboard";

jest.mock("@workspaceui/api-client/src/api/dashboard", () => ({
  fetchRecentDocuments: jest.fn(),
  trackRecentDocument: jest.fn(),
}));

const mockedFetch = fetchRecentDocuments as jest.Mock;
const mockedTrack = trackRecentDocument as jest.Mock;

const baseDoc = {
  recordId: "rec-1",
  identifier: "SO-001",
  windowId: "win-1",
  windowTitle: "Sales Order",
  tabId: "tab-1",
  tabLevel: 0,
};

describe("recentDocumentsStore", () => {
  beforeEach(() => {
    useRecentDocumentsStore.setState({ documents: [] });
    mockedFetch.mockReset();
    mockedTrack.mockReset();
  });

  it("resetForRole clears the current documents", () => {
    useRecentDocumentsStore.setState({ documents: [{ ...baseDoc, viewedAt: 1 }] });
    useRecentDocumentsStore.getState().resetForRole();
    expect(useRecentDocumentsStore.getState().documents).toEqual([]);
  });

  it("fetchForRole populates documents from the API", async () => {
    mockedFetch.mockResolvedValue({ items: [{ ...baseDoc, viewedAt: 42 }] });
    await useRecentDocumentsStore.getState().fetchForRole();
    expect(useRecentDocumentsStore.getState().documents).toEqual([{ ...baseDoc, viewedAt: 42 }]);
  });

  it("fetchForRole leaves documents untouched when the API call fails", async () => {
    mockedFetch.mockRejectedValue(new Error("network error"));
    await useRecentDocumentsStore.getState().fetchForRole();
    expect(useRecentDocumentsStore.getState().documents).toEqual([]);
  });

  it("track optimistically prepends the document and confirms after a successful call", async () => {
    mockedTrack.mockResolvedValue({ status: "ok" });
    await useRecentDocumentsStore.getState().track(baseDoc);
    expect(mockedTrack).toHaveBeenCalledWith(baseDoc);
    expect(useRecentDocumentsStore.getState().documents).toHaveLength(1);
    expect(useRecentDocumentsStore.getState().documents[0]).toMatchObject(baseDoc);
  });

  it("track dedupes by recordId+windowId+tabId, keeping the latest view first", async () => {
    mockedTrack.mockResolvedValue({ status: "ok" });
    useRecentDocumentsStore.setState({
      documents: [
        { ...baseDoc, viewedAt: 1 },
        { ...baseDoc, recordId: "rec-2", viewedAt: 2 },
      ],
    });
    await useRecentDocumentsStore.getState().track(baseDoc);
    const { documents } = useRecentDocumentsStore.getState();
    expect(documents).toHaveLength(2);
    expect(documents[0].recordId).toBe("rec-1");
  });

  it("reverts the optimistic update when the API call fails", async () => {
    mockedTrack.mockRejectedValue(new Error("network error"));
    await useRecentDocumentsStore.getState().track(baseDoc);
    expect(useRecentDocumentsStore.getState().documents).toEqual([]);
  });
});
