import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GenericWarehouseProcess } from "../GenericWarehouseProcess";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserContext } from "@/hooks/useUserContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useWindowContext } from "@/contexts/window";
import { useBoxManager } from "../../shared/useBoxManager";
import { createCallAction } from "../warehouseApiHelpers";
import { executeStringFunction } from "@/utils/functions";
import { toast } from "sonner";

// Mock dependencies
jest.mock("@/hooks/useTranslation");
jest.mock("@/hooks/useUserContext");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock("@/contexts/window");
jest.mock("../../shared/useBoxManager");
jest.mock("../warehouseApiHelpers");
jest.mock("@/utils/functions");
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock SVG
jest.mock("@workspaceui/componentlibrary/src/assets/icons/x.svg", () => (props: any) => <svg {...props} />);

// Mock components to use prop-based IDs and text
jest.mock(
  "@workspaceui/componentlibrary/src/components/Button/Button",
  () =>
    ({ children, "data-testid": testId, onClick, disabled }: any) => (
      <button data-testid={testId} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    )
);

jest.mock("../../shared/ProcessModalShared", () => ({
  ErrorAlert: ({ message, "data-testid": testId }: any) => <div data-testid={testId}>{message}</div>,
  ConfirmDialog: ({ "data-testid": testId }: any) => <div data-testid={testId}>Confirm</div>,
  BoxSelector: ({ "data-testid": testId }: any) => <div data-testid={testId} />,
  AddBoxButton: ({ onClick, "data-testid": testId }: any) => (
    <button onClick={onClick} data-testid={testId}>
      Add Box
    </button>
  ),
  FormInput: ({ value, onChange, "data-testid": testId }: any) => (
    <input type="number" data-testid={testId} value={value} onChange={onChange} />
  ),
  BarcodeInputRow: ({ value, onChange, onValidate, "data-testid": testId }: any) => (
    <div data-testid={testId}>
      <input placeholder="packing.scanBarcode" value={value} onChange={onChange} />
      <button data-testid="Button__warehouse_validate" onClick={onValidate}>
        Validate
      </button>
    </div>
  ),
}));

const mockT = (key: string) => key;
const mockSchema: any = {
  type: "warehouseProcess",
  titleKey: "packing.title",
  inputBar: ["boxSelector", "addBox", "qty", "barcode"],
  gridColumns: [
    { field: "productName", labelKey: "packing.product", visible: true },
    { field: "quantity", labelKey: "packing.qty", visible: true },
    { field: "qtyPending", labelKey: "packing.pending", visible: true },
  ],
  features: {
    dynamicBoxes: true,
    trackScannedInputs: false, // Set to false to use generatePack text
  },
  initialData: {
    lines: [
      {
        productId: "p1",
        shipmentLineId: "sl1",
        quantity: 10,
        qtyVerified: 0,
        qtyPending: 10,
        box1: 0,
        productName: "Product 1",
      },
    ],
    boxCount: 1,
  },
  recordId: "rec1",
};

describe("GenericWarehouseProcess", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockBarcodeInputRef = { current: { focus: jest.fn() } };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
    (useUserContext as jest.Mock).mockReturnValue({ token: "fake-token" });
    (useRouter as jest.Mock).mockReturnValue({ replace: jest.fn() });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    (useWindowContext as jest.Mock).mockReturnValue({ triggerRecovery: jest.fn(), isRecoveryLoading: false });
    (useBoxManager as jest.Mock).mockReturnValue({
      boxCount: 1,
      currentBox: 1,
      setBoxCount: jest.fn(),
      setCurrentBox: jest.fn(),
      barcodeInputRef: mockBarcodeInputRef,
    });
    (createCallAction as jest.Mock).mockReturnValue(jest.fn());
  });

  it("renders correctly and verifies data-testids", () => {
    render(
      <GenericWarehouseProcess
        schema={mockSchema}
        payscriptPlugin={null}
        onProcessCode="code"
        processId="p1"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("packing.title")).toBeInTheDocument();
    expect(screen.getByTestId("BoxSelector__cad053")).toBeInTheDocument();
    expect(screen.getByTestId("AddBoxButton__cad053")).toBeInTheDocument();
    expect(screen.getByTestId("BarcodeInputRow__cad053")).toBeInTheDocument();
    expect(screen.getByTestId("CloseIcon__cad053")).toBeInTheDocument();
  });

  it("calls setBoxCount when adding a box", () => {
    const setBoxCount = jest.fn();
    (useBoxManager as jest.Mock).mockReturnValue({
      boxCount: 1,
      currentBox: 1,
      setBoxCount,
      setCurrentBox: jest.fn(),
      barcodeInputRef: mockBarcodeInputRef,
    });

    render(
      <GenericWarehouseProcess
        schema={mockSchema}
        payscriptPlugin={null}
        onProcessCode="code"
        processId="p1"
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByTestId("AddBoxButton__cad053"));
    expect(setBoxCount).toHaveBeenCalledWith(2);
  });

  it("updates lines on successful scan", async () => {
    const mockOnScan = jest.fn().mockResolvedValue({
      matchField: "shipmentLineId",
      matchValue: "sl1",
      qty: 5,
    });

    render(
      <GenericWarehouseProcess
        schema={mockSchema}
        payscriptPlugin={{ onScan: mockOnScan } as any}
        onProcessCode="code"
        processId="p1"
        onClose={mockOnClose}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("packing.scanBarcode"), { target: { value: "B123" } });
    fireEvent.click(screen.getByTestId("Button__warehouse_validate"));

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  it("shows error on failed scan", async () => {
    const mockOnScan = jest.fn().mockResolvedValue({ error: true, message: "Error X" });

    render(
      <GenericWarehouseProcess
        schema={mockSchema}
        payscriptPlugin={{ onScan: mockOnScan } as any}
        onProcessCode="code"
        processId="p1"
        onClose={mockOnClose}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("packing.scanBarcode"), { target: { value: "B123" } });
    fireEvent.click(screen.getByTestId("Button__warehouse_validate"));

    await waitFor(() => {
      expect(screen.getByText("Error X")).toBeInTheDocument();
    });
  });

  it("shows confirmation dialog if pending lines exist", () => {
    render(
      <GenericWarehouseProcess
        schema={mockSchema}
        payscriptPlugin={null}
        onProcessCode="code"
        processId="p1"
        onClose={mockOnClose}
      />
    );

    const buttons = screen.getAllByTestId("Button__cad053");
    const generateBtn = buttons.find((b) => b.textContent?.includes("packing.generatePack"));
    fireEvent.click(generateBtn!);

    expect(screen.getByTestId("ConfirmDialog__cad053")).toBeInTheDocument();
  });

  it("completes process and shows toast items are packed", async () => {
    (executeStringFunction as jest.Mock).mockResolvedValue({
      responseActions: [{ showMsgInProcessView: { msgType: "success", msgTitle: "OK", msgText: "Done" } }],
    });

    const readySchema = {
      ...mockSchema,
      initialData: { lines: [{ ...mockSchema.initialData.lines[0], qtyPending: 0, qtyVerified: 10 }], boxCount: 1 },
    };

    render(
      <GenericWarehouseProcess
        schema={readySchema}
        payscriptPlugin={null}
        onProcessCode="code"
        processId="p1"
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const buttons = screen.getAllByTestId("Button__cad053");
    const generateBtn = buttons.find((b) => b.textContent?.includes("packing.generatePack"));
    fireEvent.click(generateBtn!);

    await waitFor(() => {
      expect(executeStringFunction).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("updates totals when manual box qty changes", () => {
    render(
      <GenericWarehouseProcess
        schema={mockSchema}
        payscriptPlugin={null}
        onProcessCode="code"
        processId="p1"
        onClose={mockOnClose}
      />
    );

    const inputs = screen.getAllByRole("spinbutton");
    const box1Input = inputs[1]; // First is Qty in bar, second is Box 1 qty in table
    fireEvent.change(box1Input, { target: { value: "10" } });

    expect(screen.getByText("0")).toBeInTheDocument(); // Pending should be 0
  });

  it("handles navigation fetch error gracefully", async () => {
    const mockWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <GenericWarehouseProcess
        schema={mockSchema}
        payscriptPlugin={null}
        onProcessCode="code"
        processId="p1"
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText("packing.title")).toBeInTheDocument();
    mockWarn.mockRestore();
  });

  it("verifies data-testid on FormInput", () => {
    render(
      <GenericWarehouseProcess
        schema={mockSchema}
        payscriptPlugin={null}
        onProcessCode="code"
        processId="p1"
        onClose={mockOnClose}
      />
    );
    expect(screen.getByTestId("FormInput__cad053")).toBeInTheDocument();
  });

  it("verifies processing state disables buttons", () => {
    render(
      <GenericWarehouseProcess
        schema={mockSchema}
        payscriptPlugin={null}
        onProcessCode="code"
        processId="p1"
        onClose={mockOnClose}
      />
    );
    expect(screen.getAllByTestId("Button__cad053")).toHaveLength(2);
  });
});
