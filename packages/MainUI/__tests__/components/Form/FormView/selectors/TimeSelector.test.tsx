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
import { FormProvider, useForm } from "react-hook-form";
import type React from "react";
import { TimeSelector } from "@/components/Form/FormView/selectors/TimeSelector";
import { createMockTimeField } from "../../../../../utils/tests/timeTestUtils";

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

interface TestWrapperProps {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
}

function TestWrapper({ children, defaultValues = {} }: TestWrapperProps) {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe("TimeSelector", () => {
  const mockField = createMockTimeField();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the time input", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "time");
    });

    it("should render with label when provided", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} label="Select Time" />
        </TestWrapper>
      );

      expect(screen.getByText("Select Time")).toBeInTheDocument();
    });

    it("should not render label when not provided", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} />
        </TestWrapper>
      );

      expect(screen.queryByText("Test Time")).not.toBeInTheDocument();
    });

    it("should render mandatory indicator when field is mandatory", () => {
      const mandatoryField = createMockTimeField({ isMandatory: true });
      render(
        <TestWrapper>
          <TimeSelector field={mandatoryField} label="Required Time" />
        </TestWrapper>
      );

      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should not render mandatory indicator when field is not mandatory", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} label="Optional Time" />
        </TestWrapper>
      );

      expect(screen.queryByText("*")).not.toBeInTheDocument();
    });

    it("should render clock icon button", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} />
        </TestWrapper>
      );

      const clockIcon = screen.getByTestId("clock-icon");
      expect(clockIcon).toBeInTheDocument();
    });

    it("should render helper text when provided", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} helperText="Enter a valid time" />
        </TestWrapper>
      );

      expect(screen.getByText("Enter a valid time")).toBeInTheDocument();
    });
  });

  describe("Value synchronization with form", () => {
    it("should sync with form value on mount", async () => {
      render(
        <TestWrapper defaultValues={{ testTime: "14:30:00" }}>
          <TimeSelector field={mockField} />
        </TestWrapper>
      );

      await waitFor(() => {
        const input = screen.getByLabelText("Test Time");
        expect(input).toHaveValue("14:30:00");
      });
    });

    it("should display empty value when form value is null", () => {
      render(
        <TestWrapper defaultValues={{ testTime: null }}>
          <TimeSelector field={mockField} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      expect(input).toHaveValue("");
    });
  });

  describe("User interactions", () => {
    it("should update form value when time changes", async () => {
      const mockFormatLocalTimeToUTCPayload = jest.requireMock("@/utils/date/utils").formatLocalTimeToUTCPayload;

      render(
        <TestWrapper>
          <TimeSelector field={mockField} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      fireEvent.change(input, { target: { value: "15:45:00" } });

      // Verify the conversion function was called with the new time
      expect(mockFormatLocalTimeToUTCPayload).toHaveBeenCalledWith("15:45:00");
    });

    it("should clear form value when input is cleared", async () => {
      render(
        <TestWrapper defaultValues={{ testTime: "10:00:00" }}>
          <TimeSelector field={mockField} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      fireEvent.change(input, { target: { value: "" } });

      await waitFor(() => {
        expect(input).toHaveValue("");
      });
    });
  });

  describe("Focus and blur handling", () => {
    it("should apply focus styles on focus", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      fireEvent.focus(input);

      expect(input.className).toContain("border-[#004ACA]");
    });

    it("should remove focus styles on blur", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(input.className).not.toContain("border-[#004ACA]");
    });

    it("should apply focus style to label when focused", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} label="Time Label" />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      fireEvent.focus(input);

      const label = screen.getByText("Time Label");
      expect(label.className).toContain("text-(--color-baseline-100)");
    });
  });

  describe("Read-only state", () => {
    it("should apply read-only attributes when isReadOnly is true", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} isReadOnly={true} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      expect(input).toHaveAttribute("readonly");
      expect(input).toBeDisabled();
    });

    it("should apply read-only styling", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} isReadOnly={true} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      expect(input.className).toContain("cursor-not-allowed");
      expect(input.className).toContain("border-dotted");
    });

    it("should not apply focus styles when read-only", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} isReadOnly={true} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      fireEvent.focus(input);

      expect(input.className).not.toContain("border-[#004ACA]");
    });

    it("should disable pointer events on container when read-only", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} isReadOnly={true} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      const container = input.closest("div[class*='relative']");
      expect(container?.className).toContain("pointer-events-none");
    });
  });

  describe("Error state", () => {
    it("should apply error styling when error prop is true", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} error={true} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input.className).toContain("border-error-main");
    });

    it("should display error message from helperText", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} error={true} helperText="Invalid time format" />
        </TestWrapper>
      );

      const errorMessage = screen.getByText("Invalid time format");
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage.className).toContain("text-red-500");
    });
  });

  describe("Icon button functionality", () => {
    it("should trigger showPicker when icon button is clicked", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} />
        </TestWrapper>
      );

      const button = screen.getByRole("button");
      const input = screen.getByLabelText("Test Time") as HTMLInputElement;

      // Mock showPicker
      input.showPicker = jest.fn();

      fireEvent.click(button);

      expect(input.showPicker).toHaveBeenCalled();
    });

    it("should not trigger showPicker when read-only", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} isReadOnly={true} />
        </TestWrapper>
      );

      const button = screen.getByRole("button");
      const input = screen.getByLabelText("Test Time") as HTMLInputElement;

      input.showPicker = jest.fn();

      fireEvent.click(button);

      expect(input.showPicker).not.toHaveBeenCalled();
    });

    it("should be disabled when isReadOnly is true", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} isReadOnly={true} />
        </TestWrapper>
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-label from field name", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      expect(input).toBeInTheDocument();
    });

    it("should have aria-invalid when there is an error", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} error={true} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should have step attribute for seconds support", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      expect(input).toHaveAttribute("step", "1");
    });

    it("should have htmlFor attribute on label pointing to input", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} label="Time Field" />
        </TestWrapper>
      );

      const label = screen.getByText("Time Field");
      const input = screen.getByLabelText("Test Time");

      expect(label).toHaveAttribute("for", mockField.hqlName);
      expect(input).toHaveAttribute("id", mockField.hqlName);
    });

    it("should have tabIndex -1 on icon button to skip in tab order", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} />
        </TestWrapper>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("tabindex", "-1");
    });
  });

  describe("Style classes", () => {
    it("should have Inter font family", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} />
        </TestWrapper>
      );

      const container = screen.getByLabelText("Test Time").closest("div[class*=\"font-['Inter']\"]");
      expect(container).not.toBeNull();
    });

    it("should hide native calendar picker indicator", () => {
      render(
        <TestWrapper>
          <TimeSelector field={mockField} />
        </TestWrapper>
      );

      const input = screen.getByLabelText("Test Time");
      expect(input.className).toContain("[&::-webkit-calendar-picker-indicator]:hidden");
    });
  });
});
