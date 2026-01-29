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

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TimeCellEditor } from "@/components/Table/CellEditors/TimeCellEditor";
import { createMockTimeField } from "../../../../utils/tests/timeTestUtils";

// Mock date utils
jest.mock("@/utils/date/utils", () => ({
  formatUTCTimeToLocal: jest.fn((value: string) => {
    if (!value) return "";
    return value.includes("T") ? "12:00:00" : value;
  }),
  formatLocalTimeToUTCPayload: jest.fn((value: string) => {
    if (!value) return "";
    return `2025-01-28T${value}`;
  }),
}));

// Mock ClockIcon
jest.mock("@workspaceui/componentlibrary/src/assets/icons/clock.svg", () => {
  return function MockClockIcon(props: React.SVGProps<SVGSVGElement>) {
    return <svg {...props} data-testid="clock-icon" />;
  };
});

describe("TimeCellEditor", () => {
  const mockOnChange = jest.fn();
  const mockOnBlur = jest.fn();
  const mockField = createMockTimeField();

  const defaultProps = {
    value: "12:30:00",
    onChange: mockOnChange,
    onBlur: mockOnBlur,
    field: mockField,
    hasError: false,
    disabled: false,
    shouldAutoFocus: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the time input", () => {
      render(<TimeCellEditor {...defaultProps} />);

      const input = screen.getByLabelText("Test Time");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "time");
    });

    it("should render clock icon button when not disabled", () => {
      render(<TimeCellEditor {...defaultProps} />);

      const clockIcon = screen.getByTestId("clock-icon");
      expect(clockIcon).toBeInTheDocument();
    });

    it("should not render clock icon button when disabled", () => {
      render(<TimeCellEditor {...defaultProps} disabled={true} />);

      const clockIcon = screen.queryByTestId("clock-icon");
      expect(clockIcon).not.toBeInTheDocument();
    });

    it("should display converted value from UTC to local", () => {
      render(<TimeCellEditor {...defaultProps} value="2025-01-28T15:30:00Z" />);

      const input = screen.getByLabelText("Test Time");
      expect(input).toHaveValue("12:00:00");
    });

    it("should display empty value when value is null", () => {
      render(<TimeCellEditor {...defaultProps} value={null} />);

      const input = screen.getByLabelText("Test Time");
      expect(input).toHaveValue("");
    });
  });

  describe("User interactions", () => {
    it("should call onChange with UTC payload when value changes", () => {
      render(<TimeCellEditor {...defaultProps} />);

      const input = screen.getByLabelText("Test Time");
      fireEvent.change(input, { target: { value: "14:30:00" } });

      expect(mockOnChange).toHaveBeenCalledWith("2025-01-28T14:30:00");
    });

    it("should call onChange with null when value is cleared", () => {
      render(<TimeCellEditor {...defaultProps} />);

      const input = screen.getByLabelText("Test Time");
      fireEvent.change(input, { target: { value: "" } });

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it("should call onBlur when focus leaves the container", () => {
      render(<TimeCellEditor {...defaultProps} />);

      const input = screen.getByLabelText("Test Time");
      fireEvent.focus(input);
      fireEvent.blur(input, { relatedTarget: document.body });

      expect(mockOnBlur).toHaveBeenCalled();
    });

    it("should not call onBlur when focus moves within the container", () => {
      render(<TimeCellEditor {...defaultProps} />);

      const input = screen.getByLabelText("Test Time");
      const button = screen.getByRole("button");

      fireEvent.focus(input);
      fireEvent.blur(input, { relatedTarget: button });

      expect(mockOnBlur).not.toHaveBeenCalled();
    });
  });

  describe("Focus handling", () => {
    it("should auto-focus when shouldAutoFocus is true", async () => {
      render(<TimeCellEditor {...defaultProps} shouldAutoFocus={true} />);

      await waitFor(() => {
        const input = screen.getByLabelText("Test Time");
        expect(document.activeElement).toBe(input);
      });
    });

    it("should not auto-focus when disabled even if shouldAutoFocus is true", () => {
      render(<TimeCellEditor {...defaultProps} shouldAutoFocus={true} disabled={true} />);

      const input = screen.getByLabelText("Test Time");
      expect(document.activeElement).not.toBe(input);
    });

    it("should set isFocused state on focus", () => {
      render(<TimeCellEditor {...defaultProps} />);

      const input = screen.getByLabelText("Test Time");
      fireEvent.focus(input);

      // Check that the container has focus ring styling
      const container = input.closest("div[class*='relative']");
      expect(container).toHaveClass("ring-2");
    });
  });

  describe("Disabled state", () => {
    it("should have disabled and readonly attributes when disabled", () => {
      render(<TimeCellEditor {...defaultProps} disabled={true} />);

      const input = screen.getByLabelText("Test Time");
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute("readonly");
    });

    it("should apply disabled styling", () => {
      render(<TimeCellEditor {...defaultProps} disabled={true} />);

      const input = screen.getByLabelText("Test Time");
      expect(input.className).toContain("cursor-not-allowed");
    });
  });

  describe("Error state", () => {
    it("should apply error styling when hasError is true", () => {
      render(<TimeCellEditor {...defaultProps} hasError={true} />);

      const input = screen.getByLabelText("Test Time");
      const container = input.closest("div[class*='relative']");
      expect(container?.className).toContain("bg-red-50");
    });
  });

  describe("Icon button functionality", () => {
    it("should trigger showPicker when icon button is clicked", () => {
      render(<TimeCellEditor {...defaultProps} />);

      const button = screen.getByRole("button");
      const input = screen.getByLabelText("Test Time") as HTMLInputElement;

      // Mock showPicker
      input.showPicker = jest.fn();

      fireEvent.click(button);

      expect(input.showPicker).toHaveBeenCalled();
    });

    it("should not trigger showPicker when disabled", () => {
      render(<TimeCellEditor {...defaultProps} disabled={true} />);

      // Button should not be rendered when disabled
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-label", () => {
      render(<TimeCellEditor {...defaultProps} />);

      const input = screen.getByLabelText("Test Time");
      expect(input).toBeInTheDocument();
    });

    it("should use 'Time Input' as default aria-label when field.name is not provided", () => {
      const fieldWithoutName = createMockTimeField({ name: undefined as unknown as string });
      render(<TimeCellEditor {...defaultProps} field={fieldWithoutName} />);

      const input = screen.getByLabelText("Time Input");
      expect(input).toBeInTheDocument();
    });

    it("should have step attribute for seconds support", () => {
      render(<TimeCellEditor {...defaultProps} />);

      const input = screen.getByLabelText("Test Time");
      expect(input).toHaveAttribute("step", "1");
    });
  });

  describe("Value synchronization", () => {
    it("should update display value when prop value changes", () => {
      const { rerender } = render(<TimeCellEditor {...defaultProps} value="10:00:00" />);

      let input = screen.getByLabelText("Test Time");
      expect(input).toHaveValue("10:00:00");

      rerender(<TimeCellEditor {...defaultProps} value="15:45:30" />);

      input = screen.getByLabelText("Test Time");
      expect(input).toHaveValue("15:45:30");
    });

    it("should clear display value when prop value becomes null", () => {
      const { rerender } = render(<TimeCellEditor {...defaultProps} value="10:00:00" />);

      rerender(<TimeCellEditor {...defaultProps} value={null} />);

      const input = screen.getByLabelText("Test Time");
      expect(input).toHaveValue("");
    });
  });
});
