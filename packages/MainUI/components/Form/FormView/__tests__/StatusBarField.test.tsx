import { render, screen } from "@testing-library/react";
import StatusBarField from "../StatusBarField";
import type { Field } from "@workspaceui/api-client/src/api/types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("react-hook-form", () => ({
  useFormContext: () => ({
    register: (name: string) => ({ name }),
  }),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockUseFieldValue = jest.fn();
jest.mock("@/hooks/useFieldValue", () => ({
  useFieldValue: (field: Field) => mockUseFieldValue(field),
}));

// Tag renders an MUI Chip — just render label text so tests are stable
jest.mock("@workspaceui/componentlibrary/src/components/Tag", () => {
  return function MockTag({
    label,
    icon,
    tagColor,
    "data-testid": testId,
  }: {
    label: string;
    icon?: React.ReactElement;
    tagColor?: string;
    "data-testid"?: string;
  }) {
    return (
      <span data-testid={testId} data-tag-color={tagColor}>
        {label}
        {icon}
      </span>
    );
  };
});

// Mock columnsConstants so SVG icons render as simple <svg> elements with known testids.
// This replaces per-file SVG mocks and gives full control over the statusConfig shape.
jest.mock("@/utils/columnsConstants", () => {
  const React = require("react");
  const icon = (testId: string) => React.createElement("svg", { "data-testid": testId });
  return {
    statusConfig: {
      DR: { type: "draft", icon: icon("icon-DR") },
      CO: { type: "success", icon: icon("icon-CO") },
      IP: { type: "warning", icon: icon("icon-IP") },
      VO: { type: "error", icon: icon("icon-VO") },
      RE: { type: "primary", icon: icon("icon-RE") },
    },
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeField = (overrides: Partial<Field> = {}): Field =>
  ({
    id: "f1",
    hqlName: "docStatus",
    name: "Status",
    refList: [
      { value: "DR", label: "Draft", color: undefined },
      { value: "CO", label: "Booked", color: undefined },
      { value: "IP", label: "In Progress", color: undefined },
      { value: "VO", label: "Voided", color: undefined },
      { value: "RE", label: "Re-Opened", color: undefined },
    ],
    ...overrides,
  }) as unknown as Field;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("StatusBarField", () => {
  beforeEach(() => {
    mockUseFieldValue.mockReset();
  });

  it("renders a plain span when there is no tagColor and no matching refItem", () => {
    mockUseFieldValue.mockReturnValue({ displayValue: "UNKNOWN", colorValue: undefined, value: "UNKNOWN" });
    render(<StatusBarField field={makeField({ refList: [] })} />);

    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
    expect(screen.queryByTestId("StatusBarTag__docStatus")).not.toBeInTheDocument();
  });

  it("renders the field label with a colon", () => {
    mockUseFieldValue.mockReturnValue({ displayValue: "DR", colorValue: undefined, value: "DR" });
    render(<StatusBarField field={makeField()} />);

    expect(screen.getByText("Status:")).toBeInTheDocument();
  });

  it("renders a Tag when a matching refItem exists (no custom color)", () => {
    mockUseFieldValue.mockReturnValue({ displayValue: "DR", colorValue: undefined, value: "DR" });
    render(<StatusBarField field={makeField()} />);

    const tag = screen.getByTestId("StatusBarTag__docStatus");
    expect(tag).toBeInTheDocument();
    expect(tag).not.toHaveAttribute("data-tag-color");
  });

  it("renders a Tag with tagColor when colorValue is a valid color string", () => {
    mockUseFieldValue.mockReturnValue({ displayValue: "CO", colorValue: "#00ff00", value: "CO" });
    render(<StatusBarField field={makeField()} />);

    expect(screen.getByTestId("StatusBarTag__docStatus")).toHaveAttribute("data-tag-color", "#00ff00");
  });

  it("uses refList item color as fallback when colorValue is absent", () => {
    const field = makeField({
      refList: [{ value: "CO", label: "Booked", color: "#123456" }] as Field["refList"],
    });
    mockUseFieldValue.mockReturnValue({ displayValue: "CO", colorValue: undefined, value: "CO" });
    render(<StatusBarField field={field} />);

    expect(screen.getByTestId("StatusBarTag__docStatus")).toHaveAttribute("data-tag-color", "#123456");
  });

  it("companion colorValue takes precedence over refList item color", () => {
    const field = makeField({
      refList: [{ value: "CO", label: "Booked", color: "#aabbcc" }] as Field["refList"],
    });
    mockUseFieldValue.mockReturnValue({ displayValue: "CO", colorValue: "#ffffff", value: "CO" });
    render(<StatusBarField field={field} />);

    expect(screen.getByTestId("StatusBarTag__docStatus")).toHaveAttribute("data-tag-color", "#ffffff");
  });

  it.each([
    ["DR", "icon-DR"],
    ["CO", "icon-CO"],
    ["IP", "icon-IP"],
    ["VO", "icon-VO"],
    ["RE", "icon-RE"],
  ] as [string, string][])("renders %s status with its icon from statusConfig", (status, iconTestId) => {
    mockUseFieldValue.mockReturnValue({ displayValue: status, colorValue: undefined, value: status });
    render(<StatusBarField field={makeField()} />);

    expect(screen.getByTestId(iconTestId)).toBeInTheDocument();
  });

  it("shows no icon for a status not in statusConfig", () => {
    const field = makeField({
      refList: [{ value: "ZZ", label: "Unknown", color: undefined }] as Field["refList"],
    });
    mockUseFieldValue.mockReturnValue({ displayValue: "ZZ", colorValue: undefined, value: "ZZ" });
    render(<StatusBarField field={field} />);

    const tag = screen.getByTestId("StatusBarTag__docStatus");
    expect(tag.querySelector("svg")).not.toBeInTheDocument();
  });

  it("uses refList label as displayed text", () => {
    mockUseFieldValue.mockReturnValue({ displayValue: "CO", colorValue: undefined, value: "CO" });
    render(<StatusBarField field={makeField()} />);

    expect(screen.getByText("Booked")).toBeInTheDocument();
  });

  it("renders plain span when displayValue is empty string", () => {
    mockUseFieldValue.mockReturnValue({ displayValue: "", colorValue: undefined, value: "" });
    render(<StatusBarField field={makeField()} />);

    expect(screen.queryByTestId("StatusBarTag__docStatus")).not.toBeInTheDocument();
  });
});
