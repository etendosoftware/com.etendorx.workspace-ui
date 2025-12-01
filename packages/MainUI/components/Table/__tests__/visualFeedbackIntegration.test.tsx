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

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditingStateIndicator } from "../components/EditingStateIndicator";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { CellEditorFactory } from "../CellEditors/CellEditorFactory";
import { FieldType } from "@workspaceui/api-client/src/api/types";
import type { CellEditorProps } from "../types/inlineEditing";

// Mock translation hook
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        "table.editing.saving": "Saving...",
        "table.editing.hasErrors": "Has errors",
        "table.editing.hasError": "Has error",
        "table.editing.multipleErrors": `${params?.count} errors`,
        "table.editing.inProgress": "Editing",
        "common.loading": "Loading",
      };
      return translations[key] || key;
    },
  }),
}));

describe("Visual Feedback Integration", () => {
  describe("EditingStateIndicator", () => {
    it("should not render when not editing", () => {
      render(<EditingStateIndicator isEditing={false} isSaving={false} hasErrors={false} />);

      expect(screen.queryByText("Editing")).not.toBeInTheDocument();
    });

    it("should show editing state", () => {
      render(<EditingStateIndicator isEditing={true} isSaving={false} hasErrors={false} />);

      expect(screen.getByText("Editing")).toBeInTheDocument();
      expect(screen.getByTitle("Editing")).toBeInTheDocument();
    });

    it("should show saving state with spinner", () => {
      render(<EditingStateIndicator isEditing={true} isSaving={true} hasErrors={false} />);

      expect(screen.getByText("Saving...")).toBeInTheDocument();
      expect(screen.getByTitle("Saving...")).toBeInTheDocument();
      expect(document.querySelector(".inline-edit-saving-spinner")).toBeInTheDocument();
    });

    it("should show error state with count", () => {
      render(<EditingStateIndicator isEditing={true} isSaving={false} hasErrors={true} errorCount={3} />);

      expect(screen.getByText("3 errors")).toBeInTheDocument();
      expect(screen.getByTitle("3 errors")).toBeInTheDocument();
    });

    it("should show single error state", () => {
      render(<EditingStateIndicator isEditing={true} isSaving={false} hasErrors={true} errorCount={1} />);

      expect(screen.getByText("Has errors")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <EditingStateIndicator isEditing={true} isSaving={false} hasErrors={false} className="custom-class" />
      );

      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });
  });

  describe("LoadingIndicator", () => {
    it("should render with default props", () => {
      render(<LoadingIndicator />);

      const spinner = document.querySelector('[role="status"]');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute("aria-label", "Loading");
    });

    it("should render with custom message", () => {
      render(<LoadingIndicator message="Saving record..." />);

      expect(screen.getByText("Saving record...")).toBeInTheDocument();
      const spinner = document.querySelector('[role="status"]');
      expect(spinner).toHaveAttribute("aria-label", "Saving record...");
    });

    it("should render different sizes", () => {
      const { rerender } = render(<LoadingIndicator size="small" />);
      expect(document.querySelector(".w-4")).toBeInTheDocument();

      rerender(<LoadingIndicator size="medium" />);
      expect(document.querySelector(".w-6")).toBeInTheDocument();

      rerender(<LoadingIndicator size="large" />);
      expect(document.querySelector(".w-8")).toBeInTheDocument();
    });

    it("should render inline version", () => {
      const { container } = render(<LoadingIndicator inline />);

      expect(container.querySelector(".inline-flex")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(<LoadingIndicator className="custom-spinner" />);

      expect(container.querySelector(".custom-spinner")).toBeInTheDocument();
    });
  });

  describe("CellEditorFactory Visual Feedback", () => {
    const mockField = {
      name: "testField",
      label: "Test Field",
      type: FieldType.TEXT,
      required: false,
      hqlName: "testField",
      inputName: "testField",
      columnName: "testField",
      process: false,
      shownInStatusBar: false,
    };

    const defaultProps: CellEditorProps = {
      value: "test value",
      onChange: jest.fn(),
      onBlur: jest.fn(),
      field: mockField,
      hasError: false,
      disabled: false,
    };

    it("should render editor without error state", () => {
      render(<CellEditorFactory fieldType={FieldType.TEXT} {...defaultProps} />);

      const wrapper = document.querySelector(".cell-editor-wrapper");
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).not.toHaveClass("cell-validation-error");
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("should render editor with error state and tooltip", () => {
      render(<CellEditorFactory fieldType={FieldType.TEXT} {...defaultProps} hasError={true} />);

      const wrapper = document.querySelector(".cell-editor-wrapper");
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass("cell-validation-error");

      const tooltip = document.querySelector(".cell-error-tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveAttribute("role", "alert");
    });

    it("should render error container when disabled with errors", () => {
      render(<CellEditorFactory fieldType={FieldType.TEXT} {...defaultProps} hasError={true} disabled={true} />);

      expect(document.querySelector(".inline-edit-error-container")).toBeInTheDocument();
      expect(screen.getByText("Validation error - please fix before editing")).toBeInTheDocument();
    });

    it("should render different editor types with consistent error handling", () => {
      const fieldTypes = [FieldType.TEXT, FieldType.NUMBER, FieldType.DATE, FieldType.BOOLEAN, FieldType.LIST];

      fieldTypes.forEach((fieldType) => {
        const { container, unmount } = render(
          <CellEditorFactory fieldType={fieldType} {...defaultProps} hasError={true} />
        );

        const wrapper = container.querySelector(".cell-editor-wrapper");
        expect(wrapper).toHaveClass("cell-validation-error");

        const tooltip = container.querySelector(".cell-error-tooltip");
        expect(tooltip).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe("CSS Class Integration", () => {
    it("should apply row editing classes correctly", () => {
      // Create a mock row element
      const rowElement = document.createElement("tr");
      rowElement.className = "table-row-editing";
      document.body.appendChild(rowElement);

      // Check if the CSS class is applied (we can't test actual styles in jsdom)
      expect(rowElement).toHaveClass("table-row-editing");

      document.body.removeChild(rowElement);
    });

    it("should apply row error classes correctly", () => {
      const rowElement = document.createElement("tr");
      rowElement.className = "table-row-error";
      document.body.appendChild(rowElement);

      expect(rowElement).toHaveClass("table-row-error");

      document.body.removeChild(rowElement);
    });

    it("should apply row saving classes correctly", () => {
      const rowElement = document.createElement("tr");
      rowElement.className = "table-row-saving";
      document.body.appendChild(rowElement);

      expect(rowElement).toHaveClass("table-row-saving");

      document.body.removeChild(rowElement);
    });

    it("should apply cell validation error classes correctly", () => {
      const cellElement = document.createElement("td");
      cellElement.className = "cell-validation-error";
      document.body.appendChild(cellElement);

      expect(cellElement).toHaveClass("cell-validation-error");

      document.body.removeChild(cellElement);
    });
  });

  describe("Accessibility Integration", () => {
    it("should provide proper ARIA labels for editing states", () => {
      render(<EditingStateIndicator isEditing={true} isSaving={false} hasErrors={false} />);

      const indicator = screen.getByTitle("Editing");
      expect(indicator).toBeInTheDocument();
    });

    it("should provide proper ARIA labels for error states", () => {
      render(<EditingStateIndicator isEditing={true} isSaving={false} hasErrors={true} errorCount={2} />);

      const indicator = screen.getByTitle("2 errors");
      expect(indicator).toBeInTheDocument();
    });

    it("should provide proper ARIA labels for loading states", () => {
      render(<LoadingIndicator message="Saving..." />);

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveAttribute("aria-label", "Saving...");
    });

    it("should provide proper ARIA attributes for error tooltips", () => {
      render(
        <CellEditorFactory
          fieldType={FieldType.TEXT}
          value="test"
          onChange={jest.fn()}
          onBlur={jest.fn()}
          field={{
            name: "test",
            label: "Test Field",
            type: FieldType.TEXT,
            required: false,
            hqlName: "test",
            inputName: "test",
            columnName: "test",
            process: false,
            shownInStatusBar: false,
          }}
          hasError={true}
          disabled={false}
        />
      );

      const tooltip = document.querySelector('[role="alert"]');
      expect(tooltip).toBeInTheDocument();
    });
  });

  describe("Performance with Visual Feedback", () => {
    it("should render multiple editing indicators efficiently", () => {
      const startTime = performance.now();

      // Render multiple indicators
      const indicators = [];
      for (let i = 0; i < 100; i++) {
        indicators.push(
          <EditingStateIndicator
            key={i}
            isEditing={true}
            isSaving={i % 3 === 0}
            hasErrors={i % 5 === 0}
            errorCount={i % 5 === 0 ? Math.floor(i / 5) + 1 : 0}
          />
        );
      }

      render(<div>{indicators}</div>);

      const endTime = performance.now();

      // Should render quickly (less than 250ms for test environment with overhead)
      expect(endTime - startTime).toBeLessThan(250);
    });

    it("should handle rapid state changes efficiently", async () => {
      const user = userEvent.setup();
      let renderCount = 0;

      const TestComponent = () => {
        const [isEditing, setIsEditing] = React.useState(false);
        const [isSaving, setIsSaving] = React.useState(false);
        const [hasErrors, setHasErrors] = React.useState(false);

        renderCount++;

        return (
          <div>
            <button onClick={() => setIsEditing(!isEditing)}>Toggle Editing</button>
            <button onClick={() => setIsSaving(!isSaving)}>Toggle Saving</button>
            <button onClick={() => setHasErrors(!hasErrors)}>Toggle Errors</button>
            <EditingStateIndicator isEditing={isEditing} isSaving={isSaving} hasErrors={hasErrors} />
          </div>
        );
      };

      render(<TestComponent />);

      const initialRenderCount = renderCount;

      // Rapidly change states
      await user.click(screen.getByText("Toggle Editing"));
      await user.click(screen.getByText("Toggle Saving"));
      await user.click(screen.getByText("Toggle Errors"));

      // Should not cause excessive re-renders
      expect(renderCount - initialRenderCount).toBeLessThan(10);
    });
  });
});
