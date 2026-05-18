import { render, screen } from "@testing-library/react";
import SidebarContent from "../SidebarContent";

jest.mock("../WidgetContent", () => ({
  __esModule: true,
  default: ({ widgets }: { widgets: any[] }) => <div data-testid="content-grid">{widgets.length} widgets</div>,
}));

jest.mock("../../../RegisterModal", () => ({
  __esModule: true,
  default: ({ registerText }: { registerText: string }) => <div data-testid="register-modal">{registerText}</div>,
}));

const defaultTranslations = {
  register: "Register",
  registerNote: "Note",
  registerNoteRequired: "Required",
  registerNoteOptional: "Optional",
};

describe("SidebarContent", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <SidebarContent
        icon={<span data-testid="icon">★</span>}
        identifier="ID-001"
        title="Record Title"
        widgets={[]}
        translations={defaultTranslations}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the identifier", () => {
    render(
      <SidebarContent
        icon={<span>★</span>}
        identifier="ID-123"
        title="Title"
        widgets={[]}
        translations={defaultTranslations}
      />
    );
    expect(screen.getByText("ID-123")).toBeInTheDocument();
  });

  it("renders the title", () => {
    render(
      <SidebarContent
        icon={<span>★</span>}
        identifier="ID"
        title="My Record"
        widgets={[]}
        translations={defaultTranslations}
      />
    );
    expect(screen.getByText("My Record")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    render(
      <SidebarContent
        icon={<span data-testid="sidebar-icon">★</span>}
        identifier="ID"
        title="Title"
        widgets={[]}
        translations={defaultTranslations}
      />
    );
    expect(screen.getByTestId("sidebar-icon")).toBeInTheDocument();
  });

  it("renders content grid with widgets", () => {
    const widgets = [{ id: "w1" }, { id: "w2" }];
    render(
      <SidebarContent
        icon={<span>★</span>}
        identifier="ID"
        title="Title"
        widgets={widgets}
        translations={defaultTranslations}
      />
    );
    expect(screen.getByText("2 widgets")).toBeInTheDocument();
  });

  it("renders register modal", () => {
    render(
      <SidebarContent
        icon={<span>★</span>}
        identifier="ID"
        title="Title"
        widgets={[]}
        translations={{ ...defaultTranslations, register: "Register Record" }}
      />
    );
    expect(screen.getByTestId("register-modal")).toBeInTheDocument();
  });
});
