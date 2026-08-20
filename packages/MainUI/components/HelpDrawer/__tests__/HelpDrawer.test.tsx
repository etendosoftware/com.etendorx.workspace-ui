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
import { useHelpPanelStore } from "@/stores/helpPanelStore";
import { createMockWindowMetadata, createMockTab, createMockField } from "@/utils/tests/mockHelpers";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@workspaceui/componentlibrary/src/assets/icons/x.svg", () => ({
  __esModule: true,
  default: () => <svg data-testid="close-icon" />,
}));

const mockUseMetadataContext = jest.fn();
jest.mock("@/contexts/metadata", () => ({
  useMetadataContext: () => mockUseMetadataContext(),
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
  Element.prototype.scrollTo = jest.fn();
});

const setWindow = (window: ReturnType<typeof createMockWindowMetadata> | null, windowId = "W1") => {
  mockUseMetadataContext.mockReturnValue({ window, windowId });
};

describe("HelpDrawer", () => {
  beforeEach(() => {
    useHelpPanelStore.setState({ isOpen: false });
    mockUseMetadataContext.mockReset();
  });

  it("collapses to width 0 when closed", () => {
    setWindow(createMockWindowMetadata("W1"));
    render(<HelpDrawer />);
    expect(screen.getByTestId("help-drawer-panel")).toHaveStyle({ width: "0" });
  });

  it("renders no interactive content (e.g. the Close button) when closed", () => {
    // Regression test: an always-mounted Close button, even visually clipped to width 0,
    // is still reachable by unscoped accessibility queries (getByRole("button", { name: "Close" }))
    // and broke an E2E test that matched it instead of an unrelated dialog's own Close button.
    setWindow({ ...createMockWindowMetadata("W1"), helpComment: "Some window help" });
    render(<HelpDrawer />);
    expect(screen.queryByRole("button", { name: "common.close" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Window W1/)).not.toBeInTheDocument();
  });

  it("expands to the panel width when open", () => {
    setWindow(createMockWindowMetadata("W1"));
    useHelpPanelStore.setState({ isOpen: true });
    render(<HelpDrawer />);
    expect(screen.getByTestId("help-drawer-panel")).toHaveStyle({ width: "42rem" });
  });

  it("renders the window title and sanitized window helpComment", () => {
    useHelpPanelStore.setState({ isOpen: true });
    setWindow({ ...createMockWindowMetadata("W1"), helpComment: "<p>Window help</p><script>alert(1)</script>" });
    render(<HelpDrawer />);

    expect(screen.getByText(/Window W1/)).toBeInTheDocument();
    expect(screen.getByText("Window help")).toBeInTheDocument();
    expect(document.querySelector("script")).not.toBeInTheDocument();
  });

  it("renders tabs ordered by sequenceNumber with their field help", () => {
    useHelpPanelStore.setState({ isOpen: true });
    const field = createMockField({ id: "f1", name: "Document No.", helpComment: "Field help text" });
    const tabA = createMockTab({ id: "a", name: "Lines", sequenceNumber: 20, helpComment: "Lines help", fields: {} });
    const tabB = createMockTab({
      id: "b",
      name: "Header",
      sequenceNumber: 10,
      helpComment: "Header help",
      fields: { f1: field },
    });
    setWindow({ ...createMockWindowMetadata("W1"), tabs: [tabA, tabB] });

    render(<HelpDrawer />);

    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(["Header", "Lines"]);
    expect(screen.getByText("Document No.")).toBeInTheDocument();
    expect(screen.getByText("Field help text")).toBeInTheDocument();
  });

  it("lists fields with no help content too, matching Classic (name shown, body left blank)", () => {
    useHelpPanelStore.setState({ isOpen: true });
    const withHelp = createMockField({ id: "f1", name: "Has Help", helpComment: "yes" });
    const withoutHelp = createMockField({
      id: "f2",
      name: "No Help",
      helpComment: "",
      column: { helpComment: undefined },
    });
    const tab = createMockTab({ id: "t1", fields: { withHelp, withoutHelp } });
    setWindow({ ...createMockWindowMetadata("W1"), tabs: [tab] });

    render(<HelpDrawer />);

    expect(screen.getByText("Has Help")).toBeInTheDocument();
    expect(screen.getByText("No Help")).toBeInTheDocument();
  });

  it("closes when the close (X) button is clicked", () => {
    useHelpPanelStore.setState({ isOpen: true });
    setWindow(createMockWindowMetadata("W1"));
    render(<HelpDrawer />);

    fireEvent.click(screen.getByLabelText("common.close"));

    expect(useHelpPanelStore.getState().isOpen).toBe(false);
  });

  it("closes on Escape when open", () => {
    useHelpPanelStore.setState({ isOpen: true });
    setWindow(createMockWindowMetadata("W1"));
    render(<HelpDrawer />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(useHelpPanelStore.getState().isOpen).toBe(false);
  });

  it("does not react to Escape when already closed", () => {
    setWindow(createMockWindowMetadata("W1"));
    render(<HelpDrawer />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(useHelpPanelStore.getState().isOpen).toBe(false);
  });

  it("renders an empty sidebar and no window help when there is no active window yet", () => {
    useHelpPanelStore.setState({ isOpen: true });
    setWindow(null);
    render(<HelpDrawer />);

    expect(screen.getByLabelText("common.helpFor")).toBeEmptyDOMElement();
    expect(screen.getByTestId("help-drawer-content")).toBeEmptyDOMElement();
  });

  it("closes when the active window changes while open", () => {
    useHelpPanelStore.setState({ isOpen: true });
    setWindow(createMockWindowMetadata("W1"), "w1");
    const { rerender } = render(<HelpDrawer />);
    expect(useHelpPanelStore.getState().isOpen).toBe(true);

    setWindow(createMockWindowMetadata("W2"), "w2");
    rerender(<HelpDrawer />);

    expect(useHelpPanelStore.getState().isOpen).toBe(false);
  });
});

describe("HelpDrawer tab index sidebar", () => {
  beforeEach(() => {
    useHelpPanelStore.setState({ isOpen: true });
    mockUseMetadataContext.mockReset();
  });

  it("renders one sidebar button per tab, in sequenceNumber order", () => {
    const tabA = createMockTab({ id: "a", name: "Lines", sequenceNumber: 20, fields: {} });
    const tabB = createMockTab({ id: "b", name: "Header", sequenceNumber: 10, fields: {} });
    setWindow({ ...createMockWindowMetadata("W1"), tabs: [tabA, tabB] });

    render(<HelpDrawer />);

    expect(screen.getByTestId("help-toc-item-b")).toHaveTextContent("Header");
    expect(screen.getByTestId("help-toc-item-a")).toHaveTextContent("Lines");
  });

  it("marks the first tab (by sequenceNumber) as active by default", () => {
    const tabA = createMockTab({ id: "a", name: "Lines", sequenceNumber: 20, fields: {} });
    const tabB = createMockTab({ id: "b", name: "Header", sequenceNumber: 10, fields: {} });
    setWindow({ ...createMockWindowMetadata("W1"), tabs: [tabA, tabB] });

    render(<HelpDrawer />);

    expect(screen.getByTestId("help-toc-item-b")).toHaveAttribute("aria-current", "true");
    expect(screen.getByTestId("help-toc-item-a")).not.toHaveAttribute("aria-current");
  });

  it("scrolls the matching section into view when a sidebar item is clicked", () => {
    const tab = createMockTab({ id: "t1", name: "Header", fields: {} });
    setWindow({ ...createMockWindowMetadata("W1"), tabs: [tab] });

    render(<HelpDrawer />);
    fireEvent.click(screen.getByTestId("help-toc-item-t1"));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("scrolls the matching field into view when its quick-jump link is clicked", () => {
    const field = createMockField({ id: "f1", name: "Document No.", helpComment: "Field help text" });
    const tab = createMockTab({ id: "t1", name: "Header", fields: { f1: field } });
    setWindow({ ...createMockWindowMetadata("W1"), tabs: [tab] });

    render(<HelpDrawer />);
    fireEvent.click(screen.getByTestId("help-field-link-f1"));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("scrolls the content pane to the top when a section's back-to-top button is clicked", () => {
    const tab = createMockTab({ id: "t1", name: "Header", fields: {} });
    setWindow({ ...createMockWindowMetadata("W1"), tabs: [tab] });

    render(<HelpDrawer />);
    fireEvent.click(screen.getByTestId("help-back-to-top-t1"));

    expect(Element.prototype.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("updates the active tab as the content pane is scrolled", () => {
    const tabA = createMockTab({ id: "a", name: "Header", sequenceNumber: 10, fields: {} });
    const tabB = createMockTab({ id: "b", name: "Lines", sequenceNumber: 20, fields: {} });
    setWindow({ ...createMockWindowMetadata("W1"), tabs: [tabA, tabB] });

    render(<HelpDrawer />);

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

  it("stops scanning once a section below the active threshold is reached", () => {
    const tabA = createMockTab({ id: "a", name: "Header", sequenceNumber: 10, fields: {} });
    const tabB = createMockTab({ id: "b", name: "Lines", sequenceNumber: 20, fields: {} });
    const tabC = createMockTab({ id: "c", name: "Tax", sequenceNumber: 30, fields: {} });
    setWindow({ ...createMockWindowMetadata("W1"), tabs: [tabA, tabB, tabC] });

    render(<HelpDrawer />);

    const content = screen.getByTestId("help-drawer-content");
    const headerSection = screen.getByRole("heading", { name: "Header" }).closest("section") as HTMLElement;
    const linesSection = screen.getByRole("heading", { name: "Lines" }).closest("section") as HTMLElement;
    const taxSection = screen.getByRole("heading", { name: "Tax" }).closest("section") as HTMLElement;

    jest.spyOn(content, "getBoundingClientRect").mockReturnValue({ top: 0 } as unknown as DOMRect);
    jest.spyOn(headerSection, "getBoundingClientRect").mockReturnValue({ top: -100 } as unknown as DOMRect);
    jest.spyOn(linesSection, "getBoundingClientRect").mockReturnValue({ top: 10 } as unknown as DOMRect);
    // Below the ACTIVE_TAB_THRESHOLD_PX (16): scanning must stop here, not mark Tax active.
    jest.spyOn(taxSection, "getBoundingClientRect").mockReturnValue({ top: 200 } as unknown as DOMRect);

    fireEvent.scroll(content);

    expect(screen.getByTestId("help-toc-item-b")).toHaveAttribute("aria-current", "true");
    expect(screen.getByTestId("help-toc-item-c")).not.toHaveAttribute("aria-current");
  });
});
