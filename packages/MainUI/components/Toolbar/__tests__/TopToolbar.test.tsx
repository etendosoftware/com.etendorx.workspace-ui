import { render } from "@testing-library/react";
import TopToolbar from "../TopToolbar/TopToolbar";
import type { ToolbarButton } from "../types";

const button = (key: string): ToolbarButton =>
  ({ key, icon: <span>{key}</span>, tooltip: key, onClick: jest.fn(), disabled: false }) as unknown as ToolbarButton;

/** The toolbar row: [left + center groups, right group]. The sections do not forward a test id to the DOM. */
const renderToolbar = () => {
  const { container } = render(
    <TopToolbar
      leftSection={{ buttons: [button("new")] }}
      centerSection={{ buttons: [button("delete"), button("copy")] }}
      rightSection={{ buttons: [button("filter")] }}
    />
  );
  const [leftAndCenter, right] = Array.from((container.firstElementChild as HTMLElement).children);
  const center = leftAndCenter.children[1];
  return { center, right };
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
});
