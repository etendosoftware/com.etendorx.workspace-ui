import { render, screen } from "@testing-library/react";
import TabPanel from "./index";

describe("TabPanel", () => {
  it("renders children when value matches index", () => {
    render(
      <TabPanel value={0} index={0}>
        <div>Tab Content</div>
      </TabPanel>
    );

    expect(screen.getByText("Tab Content")).toBeInTheDocument();
  });

  it("hides content when value does not match index", () => {
    render(
      <TabPanel value={0} index={1}>
        <div>Tab Content</div>
      </TabPanel>
    );

    const tabPanel = screen.getByRole("tabpanel", { hidden: true });
    expect(tabPanel).toHaveAttribute("hidden");
  });

  it("applies correct ARIA attributes", () => {
    render(
      <TabPanel value={0} index={0}>
        <div>Tab Content</div>
      </TabPanel>
    );

    const tabPanel = screen.getByRole("tabpanel");
    expect(tabPanel).toHaveAttribute("id", "tabpanel-0");
    expect(tabPanel).toHaveAttribute("aria-labelledby", "tab-0");
  });

  it("renders with different index values", () => {
    render(
      <TabPanel value={2} index={2}>
        <div>Tab 2 Content</div>
      </TabPanel>
    );

    const tabPanel = screen.getByRole("tabpanel");
    expect(tabPanel).toHaveAttribute("id", "tabpanel-2");
    expect(screen.getByText("Tab 2 Content")).toBeInTheDocument();
  });
});
