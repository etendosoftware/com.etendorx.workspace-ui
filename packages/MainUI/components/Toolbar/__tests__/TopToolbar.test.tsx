import { render, screen } from "@testing-library/react";
import TopToolbar, { EXTRAS_SLOT_CLASSES, LEFT_GROUP_CLASSES } from "../TopToolbar/TopToolbar";
import type { ToolbarButton, TopToolbarProps } from "../types";

const button = (key: string): ToolbarButton =>
  ({ key, icon: <span>{key}</span>, tooltip: key, onClick: jest.fn(), disabled: false }) as unknown as ToolbarButton;

const PROCESS_TEXT = "Available Process";

const processButton = (disabled = false) =>
  ({ key: "process", text: PROCESS_TEXT, onClick: jest.fn(), disabled }) as unknown as TopToolbarProps["processButton"];

/** The toolbar row: [left + center groups, right group]. The sections do not forward a test id to the DOM. */
const renderToolbar = (props: Partial<TopToolbarProps> = {}) => {
  const { container } = render(
    <TopToolbar
      leftSection={{ buttons: [button("new")] }}
      centerSection={{ buttons: [button("delete"), button("copy")] }}
      rightSection={{ buttons: [button("filter")] }}
      {...props}
    />
  );
  const [leftAndCenter, right] = Array.from((container.firstElementChild as HTMLElement).children);
  const centerGroup = screen.getByTestId("TopToolbar__center");
  const center = centerGroup.firstElementChild as HTMLElement;
  return { center, centerGroup, right, leftAndCenter };
};

describe("TopToolbar layout", () => {
  it("lets the center group scroll instead of spilling under the right group on a narrow screen", () => {
    const { center } = renderToolbar();

    expect(center).toHaveClass("min-w-0", "flex-1", "overflow-x-auto");
  });

  it("keeps the right group, which holds the filters and the record navigation, at its own width", () => {
    const { right } = renderToolbar();

    expect(right).toHaveClass("shrink-0");
  });

  it("keeps the process button outside the scrolling icons, so a narrow row does not cut it", () => {
    const { center, centerGroup } = renderToolbar({ processButton: processButton() });

    const processWrapper = screen.getByText(PROCESS_TEXT).closest("div.shrink-0");
    expect(processWrapper).not.toBeNull();
    expect(centerGroup).toContainElement(processWrapper as HTMLElement);
    expect(center).not.toContainElement(processWrapper as HTMLElement);
  });

  it("hides a disabled process button", () => {
    renderToolbar({ processButton: processButton(true) });

    expect(screen.queryByText(PROCESS_TEXT)).not.toBeInTheDocument();
  });

  it("shows no process button when the center group has no buttons, as before", () => {
    renderToolbar({ centerSection: { buttons: [] }, processButton: processButton() });

    expect(screen.queryByText(PROCESS_TEXT)).not.toBeInTheDocument();
  });

  it("paints the refresh button like its neighbours instead of a filled circle", () => {
    const { leftAndCenter } = renderToolbar();

    expect(leftAndCenter.firstElementChild).toHaveClass("[&_.toolbar-button-refresh:not(:hover)]:bg-transparent");
  });

  it("keeps the accent fill of refresh on hover, where its icon turns white", () => {
    expect(LEFT_GROUP_CLASSES).not.toContain("[&_.toolbar-button-refresh]:bg-transparent");
  });

  it("draws the grid extras (fullscreen, record navigation) with the same ink as the toolbar icons", () => {
    renderToolbar();

    expect(screen.getByTestId("ToolbarExtrasSlot__container")).toHaveClass(
      "[&_button:not(:disabled)]:text-(--ui-text)!"
    );
  });

  it("leaves disabled extras (previous / next record at the ends) with the disabled colour", () => {
    expect(EXTRAS_SLOT_CLASSES).not.toContain("[&_button]:text-");
  });
});
