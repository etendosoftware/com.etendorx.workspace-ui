/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may not use this file except in compliance with the License at
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

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import DynamicTable from '../index';
import { TestProviders } from '../../../__tests__/test-utils';
import type { EntityData, Column } from '@workspaceui/api-client/src/api/types';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the hooks and contexts (same as other tests)
jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/contexts/datasourceContext', () => ({
  useDatasourceContext: () => ({
    registerDatasource: jest.fn(),
    unregisterDatasource: jest.fn(),
    registerRefetchFunction: jest.fn(),
    registerRecordsGetter: jest.fn(),
    registerHasMoreRecordsGetter: jest.fn(),
    registerFetchMore: jest.fn(),
  }),
}));

jest.mock('@/contexts/ToolbarContext', () => ({
  useToolbarContext: () => ({
    registerActions: jest.fn(),
    registerAttachmentAction: jest.fn(),
    setShouldOpenAttachmentModal: jest.fn(),
  }),
}));

jest.mock('@/contexts/tab', () => ({
  useTabContext: () => ({
    tab: { id: 'test-tab', window: 'test-window' },
    parentTab: null,
    parentRecord: null,
  }),
}));

jest.mock('@/hooks/useSelected', () => ({
  useSelected: () => ({
    graph: {
      getParent: jest.fn(),
      getSelected: jest.fn(),
      setSelected: jest.fn(),
      setSelectedMultiple: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      getChildren: jest.fn(() => []),
    },
  }),
}));

jest.mock('@/hooks/navigation/useMultiWindowURL', () => ({
  useMultiWindowURL: () => ({
    activeWindow: { windowId: 'test-window' },
    getSelectedRecord: jest.fn(),
  }),
}));

jest.mock('@/hooks/useUserContext', () => ({
  useUserContext: () => ({
    user: { id: 'test-user' },
  }),
}));

jest.mock('@/hooks/table/useTableData', () => ({
  useTableData: () => ({
    displayRecords: mockRecords,
    records: mockRecords,
    columns: mockColumns,
    expanded: {},
    loading: false,
    error: null,
    shouldUseTreeMode: false,
    handleMRTColumnFiltersChange: jest.fn(),
    handleMRTColumnVisibilityChange: jest.fn(),
    handleMRTSortingChange: jest.fn(),
    handleMRTColumnOrderChange: jest.fn(),
    handleMRTExpandChange: jest.fn(),
    toggleImplicitFilters: jest.fn(),
    fetchMore: jest.fn(),
    refetch: jest.fn(),
    removeRecordLocally: jest.fn(),
    hasMoreRecords: false,
    applyQuickFilter: jest.fn(),
  }),
}));

jest.mock('@/hooks/useTableStatePersistenceTab', () => ({
  useTableStatePersistenceTab: () => ({
    tableColumnFilters: [],
    tableColumnVisibility: {},
    tableColumnSorting: [],
    tableColumnOrder: [],
  }),
}));

jest.mock('@/hooks/useTableSelection', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockColumns: Column[] = [
  {
    id: 'name',
    name: 'name',
    header: 'Name',
    columnName: 'name',
    displayType: 'string',
    isMandatory: true,
    _identifier: 'name',
  },
  {
    id: 'email',
    name: 'email',
    header: 'Email',
    columnName: 'email',
    displayType: 'string',
    isMandatory: false,
    _identifier: 'email',
  },
  {
    id: 'age',
    name: 'age',
    header: 'Age',
    columnName: 'age',
    displayType: 'number',
    isMandatory: false,
    _identifier: 'age',
  },
  {
    id: 'active',
    name: 'active',
    header: 'Active',
    columnName: 'active',
    displayType: 'boolean',
    isMandatory: false,
    _identifier: 'active',
  },
];

const mockRecords: EntityData[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    active: true,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    age: 25,
    active: false,
  },
];

const renderDynamicTable = (props = {}) => {
  const defaultProps = {
    setRecordId: jest.fn(),
    onRecordSelection: jest.fn(),
    isTreeMode: false,
  };

  return render(
    <TestProviders>
      <DynamicTable {...defaultProps} {...props} />
    </TestProviders>
  );
};

describe('Inline Editing Accessibility Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('WCAG Compliance', () => {
    it('should have no accessibility violations in read-only mode', async () => {
      const { container } = renderDynamicTable();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in edit mode', async () => {
      const { container } = renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with validation errors', async () => {
      const { container } = renderDynamicTable();

      // Start editing and create validation errors
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });

      // Clear required field to trigger validation error
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      await user.tab(); // Trigger validation

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ARIA Labels and Roles', () => {
    it('should have proper table structure with ARIA roles', async () => {
      renderDynamicTable();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check table has proper role
      const table = screen.getByRole('grid');
      expect(table).toBeInTheDocument();
      expect(table).toHaveAttribute('aria-label');

      // Check rows have proper roles
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA attributes for editable cells', async () => {
      renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });

      // Check input has proper ARIA attributes
      const nameInput = screen.getByDisplayValue('John Doe');
      expect(nameInput).toHaveAttribute('aria-label');
      expect(nameInput).toHaveAttribute('role', 'gridcell');
      expect(nameInput).toHaveAttribute('aria-rowindex');
      expect(nameInput).toHaveAttribute('aria-colindex');
      expect(nameInput).toHaveAttribute('aria-required');
    });

    it('should have proper ARIA attributes for action buttons', async () => {
      renderDynamicTable();

      // Check edit button
      const editButton = screen.getByTestId('edit-button-1');
      expect(editButton).toHaveAttribute('aria-label');
      expect(editButton).toHaveAttribute('role', 'button');

      // Start editing to check save/cancel buttons
      await user.click(editButton);

      await waitFor(() => {
        const saveButton = screen.getByTestId('save-button-1');
        expect(saveButton).toBeInTheDocument();
      });

      const saveButton = screen.getByTestId('save-button-1');
      const cancelButton = screen.getByTestId('cancel-button-1');

      expect(saveButton).toHaveAttribute('aria-label');
      expect(saveButton).toHaveAttribute('role', 'button');
      expect(cancelButton).toHaveAttribute('aria-label');
      expect(cancelButton).toHaveAttribute('role', 'button');
    });

    it('should have proper ARIA attributes for error states', async () => {
      renderDynamicTable();

      // Start editing and create validation errors
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });

      // Clear required field to trigger validation error
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      await user.tab(); // Trigger validation

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });

      // Check error message has proper ARIA attributes
      const errorElement = document.querySelector('[role="alert"]');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support Tab navigation between editable cells', async () => {
      renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });

      // Check initial focus
      const nameInput = screen.getByDisplayValue('John Doe');
      expect(nameInput).toHaveFocus();

      // Tab to next field
      await user.tab();
      const emailInput = screen.getByDisplayValue('john@example.com');
      expect(emailInput).toHaveFocus();

      // Tab to next field
      await user.tab();
      const ageInput = screen.getByDisplayValue('30');
      expect(ageInput).toHaveFocus();
    });

    it('should support Shift+Tab for reverse navigation', async () => {
      renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });

      // Tab to second field
      await user.tab();
      const emailInput = screen.getByDisplayValue('john@example.com');
      expect(emailInput).toHaveFocus();

      // Shift+Tab back to first field
      await user.tab({ shift: true });
      const nameInput = screen.getByDisplayValue('John Doe');
      expect(nameInput).toHaveFocus();
    });

    it('should support Enter key for saving', async () => {
      renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });

      // Make a change
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      // Press Enter to save
      await user.keyboard('{Enter}');

      // Verify save operation completed
      await waitFor(() => {
        expect(screen.getByText('Updated Name')).toBeInTheDocument();
      });
    });

    it('should support Escape key for canceling', async () => {
      renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });

      // Make a change
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      await user.type(nameInput, 'Will be cancelled');

      // Press Escape to cancel
      await user.keyboard('{Escape}');

      // Verify changes are cancelled
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should trap focus within action button groups', async () => {
      renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const saveButton = screen.getByTestId('save-button-1');
        expect(saveButton).toBeInTheDocument();
      });

      // Focus on save button
      const saveButton = screen.getByTestId('save-button-1');
      saveButton.focus();
      expect(saveButton).toHaveFocus();

      // Tab to cancel button
      await user.tab();
      const cancelButton = screen.getByTestId('cancel-button-1');
      expect(cancelButton).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should have ARIA live regions for announcements', async () => {
      renderDynamicTable();

      // Check for ARIA live regions
      const liveRegions = document.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);

      // Check for polite and assertive regions
      const politeRegion = document.querySelector('[aria-live="polite"]');
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      
      expect(politeRegion).toBeInTheDocument();
      expect(assertiveRegion).toBeInTheDocument();
    });

    it('should announce editing state changes', async () => {
      renderDynamicTable();

      // Start editing - this should trigger an announcement
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });

      // Check that live regions exist for announcements
      const liveRegions = document.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    it('should announce validation errors', async () => {
      renderDynamicTable();

      // Start editing and create validation errors
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });

      // Clear required field to trigger validation error
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      await user.tab(); // Trigger validation

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });

      // Check for error announcement elements
      const errorElements = document.querySelectorAll('[role="alert"]');
      expect(errorElements.length).toBeGreaterThan(0);
    });

    it('should provide proper context for screen readers', async () => {
      renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });

      // Check that inputs have descriptive labels
      const nameInput = screen.getByDisplayValue('John Doe');
      const ariaLabel = nameInput.getAttribute('aria-label');
      expect(ariaLabel).toContain('name'); // Should contain field name
      expect(ariaLabel).toContain('row'); // Should contain row context
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should have sufficient color contrast for error states', async () => {
      renderDynamicTable();

      // Start editing and create validation errors
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });

      // Clear required field to trigger validation error
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      await user.tab(); // Trigger validation

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });

      // Check that error styling is applied
      expect(nameInput).toHaveClass('border-red-500');
      
      // Error indicators should be visible
      const errorIndicator = screen.getByTestId('error-indicator-1');
      expect(errorIndicator).toBeInTheDocument();
    });

    it('should have proper focus indicators', async () => {
      renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });

      // Check focus styling
      const nameInput = screen.getByDisplayValue('John Doe');
      expect(nameInput).toHaveClass('focus:ring-2');
      expect(nameInput).toHaveClass('focus:ring-blue-500');
    });

    it('should not rely solely on color for information', async () => {
      renderDynamicTable();

      // Start editing and create validation errors
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });

      // Clear required field to trigger validation error
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      await user.tab(); // Trigger validation

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });

      // Error should be indicated by more than just color
      expect(nameInput).toHaveAttribute('aria-invalid', 'true'); // ARIA attribute
      
      const errorIndicator = screen.getByTestId('error-indicator-1');
      expect(errorIndicator).toBeInTheDocument(); // Visual icon
      expect(errorIndicator).toHaveAttribute('title'); // Tooltip text
    });
  });

  describe('Mobile and Touch Accessibility', () => {
    it('should have adequate touch targets', async () => {
      renderDynamicTable();

      // Check button sizes
      const editButton = screen.getByTestId('edit-button-1');
      const buttonRect = editButton.getBoundingClientRect();
      
      // Buttons should be at least 44x44 pixels (WCAG guideline)
      expect(buttonRect.width).toBeGreaterThanOrEqual(44);
      expect(buttonRect.height).toBeGreaterThanOrEqual(44);
    });

    it('should support touch interactions', async () => {
      renderDynamicTable();

      // Simulate touch interaction
      const editButton = screen.getByTestId('edit-button-1');
      
      // Touch events should work
      fireEvent.touchStart(editButton);
      fireEvent.touchEnd(editButton);
      fireEvent.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });
    });
  });

  describe('High Contrast Mode Support', () => {
    it('should work in high contrast mode', async () => {
      // Simulate high contrast mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderDynamicTable();

      // Start editing
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe');
        expect(nameInput).toBeInTheDocument();
      });

      // Elements should still be accessible in high contrast mode
      const nameInput = screen.getByDisplayValue('John Doe');
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute('aria-label');
    });
  });
});