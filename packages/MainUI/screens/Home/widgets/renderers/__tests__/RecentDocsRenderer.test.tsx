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

import { fireEvent, render, screen } from "@testing-library/react";
import RecentDocsRenderer from "@/screens/Home/widgets/renderers/RecentDocsRenderer";
import { useRecentDocuments } from "@/hooks/useRecentDocuments";
import { useRedirect } from "@/hooks/navigation/useRedirect";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/hooks/useRecentDocuments");
jest.mock("@/hooks/navigation/useRedirect");

const mockedUseRecentDocuments = useRecentDocuments as jest.Mock;
const mockedUseRedirect = useRedirect as jest.Mock;

const doc = {
  recordId: "rec-1",
  identifier: "SO-001",
  windowId: "win-1",
  windowTitle: "Sales Order",
  tabId: "tab-1",
  tabLevel: 0,
  viewedAt: 123,
};

describe("RecentDocsRenderer", () => {
  const handleClickRedirect = jest.fn();

  beforeEach(() => {
    handleClickRedirect.mockClear();
    mockedUseRedirect.mockReturnValue({ handleClickRedirect });
  });

  it("shows the empty state when there are no recent documents", () => {
    mockedUseRecentDocuments.mockReturnValue({ documents: [] });
    render(<RecentDocsRenderer />);
    expect(screen.getByTestId("RecentDocsRenderer__empty")).toBeInTheDocument();
  });

  it("renders one entry per document and navigates via useRedirect on click", () => {
    mockedUseRecentDocuments.mockReturnValue({ documents: [doc] });
    render(<RecentDocsRenderer />);

    const item = screen.getByTestId(`RecentDocsRenderer__item_${doc.windowId}_${doc.recordId}`);
    expect(item).toHaveTextContent(doc.identifier);

    fireEvent.click(item);

    expect(handleClickRedirect).toHaveBeenCalledTimes(1);
    const call = handleClickRedirect.mock.calls[0][0];
    expect(call).toMatchObject({
      windowId: doc.windowId,
      windowTitle: doc.windowTitle,
      referencedTabId: doc.tabId,
      selectedRecordId: doc.recordId,
      tabLevel: doc.tabLevel,
    });
  });
});
