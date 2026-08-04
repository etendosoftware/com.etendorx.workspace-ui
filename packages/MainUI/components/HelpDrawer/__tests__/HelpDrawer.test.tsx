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

import { render, screen, fireEvent } from "@testing-library/react";
import HelpDrawer from "../HelpDrawer";
import { createMockWindowMetadata, createMockTab, createMockField } from "@/utils/tests/mockHelpers";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../../Modal", () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="mock-modal">{children}</div> : null,
}));

jest.mock("@workspaceui/componentlibrary/src/assets/icons/x.svg", () => ({
  __esModule: true,
  default: () => <svg data-testid="close-icon" />,
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

describe("HelpDrawer", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it("renders nothing when closed", () => {
    const window = createMockWindowMetadata("W1");
    render(<HelpDrawer open={false} window={window} onClose={mockOnClose} />);
    expect(screen.queryByTestId("mock-modal")).not.toBeInTheDocument();
  });

  it("renders the window title and sanitized window helpComment", () => {
    const window = { ...createMockWindowMetadata("W1"), helpComment: "<p>Window help</p><script>alert(1)</script>" };
    render(<HelpDrawer open={true} window={window} onClose={mockOnClose} />);

    expect(screen.getByText(/Window W1/)).toBeInTheDocument();
    expect(screen.getByText("Window help")).toBeInTheDocument();
    expect(document.querySelector("script")).not.toBeInTheDocument();
  });

  it("renders tabs ordered by sequenceNumber with their field help", () => {
    const field = createMockField({ id: "f1", name: "Document No.", helpComment: "Field help text" });
    const tabA = createMockTab({ id: "a", name: "Lines", sequenceNumber: 20, helpComment: "Lines help", fields: {} });
    const tabB = createMockTab({
      id: "b",
      name: "Header",
      sequenceNumber: 10,
      helpComment: "Header help",
      fields: { f1: field },
    });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tabA, tabB] };

    render(<HelpDrawer open={true} window={window} onClose={mockOnClose} />);

    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(["Header", "Lines"]);
    expect(screen.getByText("Document No.")).toBeInTheDocument();
    expect(screen.getByText("Field help text")).toBeInTheDocument();
  });

  it("omits fields with no help content", () => {
    const withHelp = createMockField({ id: "f1", name: "Has Help", helpComment: "yes" });
    const withoutHelp = createMockField({
      id: "f2",
      name: "No Help",
      helpComment: "",
      column: { helpComment: undefined },
    });
    const tab = createMockTab({ id: "t1", fields: { withHelp, withoutHelp } });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tab] };

    render(<HelpDrawer open={true} window={window} onClose={mockOnClose} />);

    expect(screen.getByText("Has Help")).toBeInTheDocument();
    expect(screen.queryByText("No Help")).not.toBeInTheDocument();
  });

  it("calls onClose when clicking the overlay", () => {
    const window = createMockWindowMetadata("W1");
    render(<HelpDrawer open={true} window={window} onClose={mockOnClose} />);

    fireEvent.click(screen.getByTestId("help-drawer-overlay"));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when clicking inside the panel", () => {
    const window = createMockWindowMetadata("W1");
    render(<HelpDrawer open={true} window={window} onClose={mockOnClose} />);

    fireEvent.click(screen.getByTestId("help-drawer-panel"));

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});

describe("HelpDrawer tab index sidebar", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it("renders one sidebar button per tab, in sequenceNumber order", () => {
    const tabA = createMockTab({ id: "a", name: "Lines", sequenceNumber: 20, fields: {} });
    const tabB = createMockTab({ id: "b", name: "Header", sequenceNumber: 10, fields: {} });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tabA, tabB] };

    render(<HelpDrawer open={true} window={window} onClose={mockOnClose} />);

    expect(screen.getByTestId("help-toc-item-b")).toHaveTextContent("Header");
    expect(screen.getByTestId("help-toc-item-a")).toHaveTextContent("Lines");
  });

  it("marks the first tab (by sequenceNumber) as active by default", () => {
    const tabA = createMockTab({ id: "a", name: "Lines", sequenceNumber: 20, fields: {} });
    const tabB = createMockTab({ id: "b", name: "Header", sequenceNumber: 10, fields: {} });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tabA, tabB] };

    render(<HelpDrawer open={true} window={window} onClose={mockOnClose} />);

    expect(screen.getByTestId("help-toc-item-b")).toHaveAttribute("aria-current", "true");
    expect(screen.getByTestId("help-toc-item-a")).not.toHaveAttribute("aria-current");
  });

  it("scrolls the matching section into view when a sidebar item is clicked", () => {
    const tab = createMockTab({ id: "t1", name: "Header", fields: {} });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tab] };

    render(<HelpDrawer open={true} window={window} onClose={mockOnClose} />);
    fireEvent.click(screen.getByTestId("help-toc-item-t1"));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("updates the active tab as the content pane is scrolled", () => {
    const tabA = createMockTab({ id: "a", name: "Header", sequenceNumber: 10, fields: {} });
    const tabB = createMockTab({ id: "b", name: "Lines", sequenceNumber: 20, fields: {} });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tabA, tabB] };

    render(<HelpDrawer open={true} window={window} onClose={mockOnClose} />);

    const content = screen.getByTestId("help-drawer-content");
    const headerSection = screen.getByRole("heading", { name: "Header" }).closest("section") as HTMLElement;
    const linesSection = screen.getByRole("heading", { name: "Lines" }).closest("section") as HTMLElement;

    jest.spyOn(content, "getBoundingClientRect").mockReturnValue({ top: 0 } as unknown as DOMRect);
    jest.spyOn(headerSection, "getBoundingClientRect").mockReturnValue({ top: -100 } as unknown as DOMRect);
    jest.spyOn(linesSection, "getBoundingClientRect").mockReturnValue({ top: 10 } as unknown as DOMRect);

    fireEvent.scroll(content);

    expect(screen.getByTestId("help-toc-item-a")).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("help-toc-item-b")).toHaveAttribute("aria-current", "true");
  });
});
