import { render, screen } from "@testing-library/react";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import TabContainer from "../TabContainer";

const tabAt = (tabLevel: number) => ({ id: `tab-${tabLevel}`, tabLevel }) as unknown as Tab;

const renderContainer = (props: Partial<React.ComponentProps<typeof TabContainer>> & { level?: number } = {}) => {
  const { level = 0, ...rest } = props;
  render(
    <TabContainer data-testid="container" collapsed={false} current={tabAt(level)} {...rest}>
      content
    </TabContainer>
  );
  return screen.getByTestId("container");
};

describe("TabContainer", () => {
  it("renders its children", () => {
    const container = renderContainer();

    expect(container).toHaveTextContent("content");
  });

  it("has the base layout and no border on the main tab", () => {
    const container = renderContainer({ level: 0 });

    expect(container).toHaveClass("flex", "flex-col", "overflow-hidden", "rounded-xl");
    expect(container.className).not.toContain("border");
  });

  it("has a border and the child band on an expanded child tab", () => {
    const container = renderContainer({ level: 1, collapsed: false });

    expect(container.className).toContain("border");
    expect(container.className).toContain("bg-(--ui-child-band)");
    expect(container.className).toContain("gap-1");
  });

  it("has no gap or band on a collapsed child tab, which has no content", () => {
    const container = renderContainer({ level: 1, collapsed: true });

    expect(container.className).not.toContain("gap-1");
    expect(container.className).not.toContain("bg-(--ui-child-band)");
    expect(container).toHaveClass("cursor-pointer");
  });

  it("takes the free space when it is the expanded top tab", () => {
    const container = renderContainer({ collapsed: false, isTopExpanded: true });

    expect(container).toHaveClass("flex-1");
    expect(container.style.height).toBe("");
  });

  it("takes a percentage of the height when it is expanded below another one", () => {
    const container = renderContainer({ collapsed: false, isTopExpanded: false, customHeight: 40 });

    expect(container.style.height).toBe("40%");
    expect(container).not.toHaveClass("flex-1");
  });

  it("has no height of its own when collapsed", () => {
    const container = renderContainer({ collapsed: true, customHeight: 40 });

    expect(container.style.height).toBe("");
  });

  it("keeps the class name and the style it is given", () => {
    const container = renderContainer({ className: "extra", style: { color: "red" }, customHeight: 25 });

    expect(container).toHaveClass("extra");
    expect(container.style.color).toBe("red");
    expect(container.style.height).toBe("25%");
  });
});
