import { render, screen } from "@testing-library/react";
import TabWidget from "../TabWidget";

jest.mock("../styles", () => ({
  useStyle: () => ({
    sx: {
      mainContainer: {},
      contentContainer: {},
    },
  }),
}));

describe("TabWidget", () => {
  it("renders noRecordText when content is not provided", () => {
    render(<TabWidget noRecordText="No data available" />);
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("renders noRecordText when content is null", () => {
    render(<TabWidget content={null} noRecordText="Empty" />);
    expect(screen.getByText("Empty")).toBeInTheDocument();
  });

  it("renders noRecordText when content is undefined", () => {
    render(<TabWidget content={undefined} noRecordText="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders title and content when content is provided", () => {
    render(<TabWidget title="My Title" content={<div>My Content</div>} noRecordText="No data" />);
    expect(screen.getByText("My Title")).toBeInTheDocument();
    expect(screen.getByText("My Content")).toBeInTheDocument();
  });

  it("does not render noRecordText when content is provided", () => {
    render(<TabWidget title="Title" content={<div>Content</div>} noRecordText="Should not appear" />);
    expect(screen.queryByText("Should not appear")).not.toBeInTheDocument();
  });

  it("renders with string content", () => {
    render(<TabWidget title="Header" content="Simple string" noRecordText="N/A" />);
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Simple string")).toBeInTheDocument();
  });
});
