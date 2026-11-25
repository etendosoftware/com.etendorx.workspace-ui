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
import { useOpenRecentDocument } from "@/hooks/navigation/useOpenRecentDocument";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/hooks/useRecentDocuments");
jest.mock("@/hooks/navigation/useOpenRecentDocument");

const mockedUseRecentDocuments = useRecentDocuments as jest.Mock;
const mockedUseOpenRecentDocument = useOpenRecentDocument as jest.Mock;

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
  const openRecentDocument = jest.fn();

  beforeEach(() => {
    openRecentDocument.mockClear();
    mockedUseOpenRecentDocument.mockReturnValue(openRecentDocument);
  });

  it("shows the empty state when there are no recent documents", () => {
    mockedUseRecentDocuments.mockReturnValue({ documents: [] });
    render(<RecentDocsRenderer />);
    expect(screen.getByTestId("RecentDocsRenderer__empty")).toBeInTheDocument();
  });

  it("renders the same record opened in two tabs of a window without repeating a key", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedUseRecentDocuments.mockReturnValue({
      documents: [
        { ...doc, windowId: "109", recordId: "0", identifier: "System", tabId: "tab-a" },
        { ...doc, windowId: "109", recordId: "0", identifier: "System", tabId: "tab-b" },
      ],
    });

    render(<RecentDocsRenderer />);

    expect(screen.getAllByText("System")).toHaveLength(2);
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining("same key"), expect.anything());
    consoleError.mockRestore();
  });

  it("keeps a long identifier on one line and shows it whole on hover", () => {
    mockedUseRecentDocuments.mockReturnValue({ documents: [doc] });
    render(<RecentDocsRenderer />);

    const item = screen.getByTestId(`RecentDocsRenderer__item_${doc.windowId}_${doc.recordId}`);
    expect(item).toHaveClass("truncate", "whitespace-nowrap", "max-w-full");
    expect(item).toHaveAttribute("title", doc.identifier);
  });

  it("renders one entry per document and opens it through useOpenRecentDocument on click", () => {
    mockedUseRecentDocuments.mockReturnValue({ documents: [doc] });
    render(<RecentDocsRenderer />);

    const item = screen.getByTestId(`RecentDocsRenderer__item_${doc.windowId}_${doc.recordId}`);
    expect(item).toHaveTextContent(doc.identifier);

    fireEvent.click(item);

    expect(openRecentDocument).toHaveBeenCalledTimes(1);
    expect(openRecentDocument).toHaveBeenCalledWith(expect.anything(), doc);
  });
});
