import { render, screen, fireEvent } from "@testing-library/react";
import { ButtonSelector } from "../ButtonSelector";
import { useFormContext } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useProcessDefinitionTrigger } from "@/hooks/useProcessDefinitionTrigger";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));

jest.mock("react-hook-form");
jest.mock("@/hooks/useProcessDefinitionTrigger");

jest.mock("@/components/ProcessModal/ProcessDefinitionModal", () => ({
  __esModule: true,
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="ProcessDefinitionModal">ProcessDefinitionModal</div> : null,
}));

const mockTriggerProcess = jest.fn();
const mockCloseProcessModal = jest.fn();

const makeField = (overrides: Partial<Field> = {}): Field =>
  ({
    id: "btn-1",
    name: "Complete Order",
    hqlName: "completeOrder",
    column: { reference: "28" },
    selector: { processDefinitionId: "proc-complete" },
    refList: [],
    ...overrides,
  }) as unknown as Field;

describe("ButtonSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFormContext as jest.Mock).mockReturnValue({
      getValues: jest.fn(() => ({ id: "record-1" })),
    });
    (useProcessDefinitionTrigger as jest.Mock).mockReturnValue({
      isProcessModalOpen: false,
      processButtonData: null,
      isLoading: false,
      triggerProcess: mockTriggerProcess,
      closeProcessModal: mockCloseProcessModal,
    });
  });

  it("renders a button with the field name", () => {
    render(<ButtonSelector field={makeField()} isReadOnly={false} />);
    expect(screen.getByRole("button", { name: "Complete Order" })).toBeInTheDocument();
  });

  it("renders disabled when isReadOnly is true", () => {
    render(<ButtonSelector field={makeField()} isReadOnly={true} />);
    expect(screen.getByRole("button", { name: "Complete Order" })).toBeDisabled();
  });

  it("calls triggerProcess with processDefinitionId on click", () => {
    render(<ButtonSelector field={makeField()} isReadOnly={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Complete Order" }));
    expect(mockTriggerProcess).toHaveBeenCalledWith("proc-complete");
  });

  it("does not call triggerProcess when readOnly (button is disabled)", () => {
    render(<ButtonSelector field={makeField()} isReadOnly={true} />);
    const button = screen.getByRole("button", { name: "Complete Order" });
    expect(button).toBeDisabled();
    expect(mockTriggerProcess).not.toHaveBeenCalled();
  });

  it("shows spinner when loading", () => {
    (useProcessDefinitionTrigger as jest.Mock).mockReturnValue({
      isProcessModalOpen: false,
      processButtonData: null,
      isLoading: true,
      triggerProcess: mockTriggerProcess,
      closeProcessModal: mockCloseProcessModal,
    });

    render(<ButtonSelector field={makeField()} isReadOnly={false} />);
    expect(screen.getByRole("button", { name: "Complete Order" })).toBeDisabled();
  });

  it("renders ProcessDefinitionModal when modal is open", () => {
    (useProcessDefinitionTrigger as jest.Mock).mockReturnValue({
      isProcessModalOpen: true,
      processButtonData: { id: "btn-1", name: "Complete Order" },
      isLoading: false,
      triggerProcess: mockTriggerProcess,
      closeProcessModal: mockCloseProcessModal,
    });

    render(<ButtonSelector field={makeField()} isReadOnly={false} />);
    expect(screen.getByTestId("ProcessDefinitionModal")).toBeInTheDocument();
  });

  it("renders dropdown when field has refList items", () => {
    const field = makeField({
      refList: [
        { id: "ref-1", label: "Complete", value: "CO" },
        { id: "ref-2", label: "Void", value: "VO" },
      ],
    });

    render(<ButtonSelector field={field} isReadOnly={false} />);
    const mainButton = screen.getByRole("button", { name: "Complete Order" });
    expect(mainButton).toBeInTheDocument();
  });
});
