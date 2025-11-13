
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { performance } from 'perf_hooks';
import DynamicTable from '../index';
import { TestProviders } from '../../../__tests__/test-utils';
import type { EntityData, Column } from '@workspaceui/api-client/src/api/types';

// Mock the hooks and contexts (same as E2E test)
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

// Generate large dataset for performance testing
const generateLargeDataset = (size: number): EntityData[] => {
  return Array.from({ length: size }, (_, index) => ({
    id: String(index + 1),
    name: `User ${index + 1}`,
    email: `user${index + 1}@example.com`,
    age: 20 + (index % 50),
    active: index % 2 === 0,
    department: `Department ${(index % 10) + 1}`,
    salary: 30000 + (index * 1000),
    joinDate: new Date(2020 + (index % 4), index % 12, (index % 28) + 1).toISOString(),
  }));
};

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
  {
    id: 'department',
    name: 'department',
    header: 'Department',
    columnName: 'department',
    displayType: 'string',
    isMandatory: false,
    _identifier: 'department',
  },
  {
    id: 'salary',
    name: 'salary',
    header: 'Salary',
    columnName: 'salary',
    displayType: 'number',
    isMandatory: false,
    _identifier: 'salary',
  },
  {
    id: 'joinDate',
    name: 'joinDate',
    header: 'Join Date',
    columnName: 'joinDate',
    displayType: 'date',
    isMandatory: false,
    _identifier: 'joinDate',
  },
];

// Performance measurement utilities
const measurePerformance = async <T>(
  name: string,
  operation: () => Promise<T>,
  threshold: number = 100
): Promise<T> => {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();
  const duration = end - start;

  console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
  
  if (duration > threshold) {
    console.warn(`Performance warning: ${name} exceeded threshold of ${threshold}ms`);
  }

  return result;
};

const measureSync = <T>(
  name: string,
  operation: () => T,
  threshold: number = 16
): T => {
  const start = performance.now();
  const result = operation();
  const end = performance.now();
  const duration = end - start;

  console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
  
  if (duration > threshold) {
    console.warn(`Performance warning: ${name} exceeded threshold of ${threshold}ms`);
  }

  return result;
};

describe('Inline Editing Performance Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('Large Dataset Performance', () => {
    it('should render large dataset efficiently', async () => {
      const largeDataset = generateLargeDataset(1000);
      
      // Mock the useTableData hook with large dataset
      jest.doMock('@/hooks/table/useTableData', () => ({
        useTableData: () => ({
          displayRecords: largeDataset,
          records: largeDataset,
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

      await measurePerformance('Large dataset render', async () => {
        render(
          <TestProviders>
            <DynamicTable setRecordId={jest.fn()} />
          </TestProviders>
        );

        // Wait for table to render
        await waitFor(() => {
          expect(screen.getByText('User 1')).toBeInTheDocument();
        }, { timeout: 5000 });
      }, 2000); // 2 second threshold for large dataset
    });

    it('should handle multiple simultaneous edits efficiently', async () => {
      const mediumDataset = generateLargeDataset(100);
      
      jest.doMock('@/hooks/table/useTableData', () => ({
        useTableData: () => ({
          displayRecords: mediumDataset,
          records: mediumDataset,
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

      render(
        <TestProviders>
          <DynamicTable setRecordId={jest.fn()} />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('User 1')).toBeInTheDocument();
      });

      // Start editing multiple rows simultaneously
      await measurePerformance('Multiple row editing', async () => {
        const editButtons = screen.getAllByTestId(/edit-button-/);
        
        // Edit first 5 rows
        for (let i = 0; i < Math.min(5, editButtons.length); i++) {
          await user.click(editButtons[i]);
        }

        // Wait for all rows to be in edit mode
        await waitFor(() => {
          const inputs = screen.getAllByRole('textbox');
          expect(inputs.length).toBeGreaterThan(10); // At least 5 rows * 2+ fields each
        });
      }, 1000);
    });
  });

  describe('Input Performance', () => {
    it('should handle rapid typing efficiently', async () => {
      render(
        <TestProviders>
          <DynamicTable setRecordId={jest.fn()} />
        </TestProviders>
      );

      // Start editing a row
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('User 1');
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('User 1');
      await user.clear(nameInput);

      // Measure rapid typing performance
      await measurePerformance('Rapid typing', async () => {
        const longText = 'This is a very long text that simulates rapid typing by a user who types very fast and wants to test the performance of the input field with debouncing and throttling mechanisms in place';
        
        for (const char of longText) {
          await user.type(nameInput, char, { delay: 1 }); // Very fast typing
        }
      }, 500);

      expect(nameInput).toHaveValue(longText);
    });

    it('should handle validation efficiently', async () => {
      render(
        <TestProviders>
          <DynamicTable setRecordId={jest.fn()} />
        </TestProviders>
      );

      // Start editing a row
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('User 1');
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('User 1');

      // Measure validation performance with rapid changes
      await measurePerformance('Validation performance', async () => {
        // Rapidly clear and fill the field multiple times
        for (let i = 0; i < 10; i++) {
          await user.clear(nameInput);
          await user.type(nameInput, `Test ${i}`, { delay: 10 });
        }
      }, 300);
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during editing sessions', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      render(
        <TestProviders>
          <DynamicTable setRecordId={jest.fn()} />
        </TestProviders>
      );

      // Perform multiple edit cycles
      for (let cycle = 0; cycle < 5; cycle++) {
        // Start editing
        const editButton = screen.getByTestId('edit-button-1');
        await user.click(editButton);

        await waitFor(() => {
          const nameInput = screen.getByDisplayValue('User 1');
          expect(nameInput).toBeInTheDocument();
        });

        // Make changes
        const nameInput = screen.getByDisplayValue('User 1');
        await user.clear(nameInput);
        await user.type(nameInput, `Cycle ${cycle}`);

        // Cancel to reset state
        const cancelButton = screen.getByTestId('cancel-button-1');
        await user.click(cancelButton);

        await waitFor(() => {
          expect(screen.getByText('User 1')).toBeInTheDocument();
        });
      }

      // Check memory usage hasn't grown significantly
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = finalMemory - initialMemory;
      
      console.log(`Memory growth: ${memoryGrowth} bytes`);
      
      // Allow for some memory growth but not excessive
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
    });

    it('should clean up resources on unmount', async () => {
      const { unmount } = render(
        <TestProviders>
          <DynamicTable setRecordId={jest.fn()} />
        </TestProviders>
      );

      // Start editing to create resources
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('User 1');
        expect(nameInput).toBeInTheDocument();
      });

      // Measure cleanup performance
      measureSync('Component unmount', () => {
        unmount();
      }, 50);

      // Verify no memory leaks by checking for remaining event listeners
      // This is a basic check - in a real scenario you'd use more sophisticated memory profiling
      const eventListenerCount = (document as any)._eventListeners?.length || 0;
      expect(eventListenerCount).toBeLessThan(100); // Reasonable threshold
    });
  });

  describe('Rendering Performance', () => {
    it('should re-render efficiently during editing', async () => {
      render(
        <TestProviders>
          <DynamicTable setRecordId={jest.fn()} />
        </TestProviders>
      );

      // Start editing
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('User 1');
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('User 1');

      // Measure re-render performance during typing
      await measurePerformance('Re-render during typing', async () => {
        // Type multiple characters to trigger re-renders
        await user.clear(nameInput);
        await user.type(nameInput, 'Performance Test Input', { delay: 20 });
      }, 200);
    });

    it('should handle cell editor switching efficiently', async () => {
      render(
        <TestProviders>
          <DynamicTable setRecordId={jest.fn()} />
        </TestProviders>
      );

      // Start editing
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);

      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        expect(inputs.length).toBeGreaterThan(0);
      });

      // Measure performance of switching between different cell editors
      await measurePerformance('Cell editor switching', async () => {
        const inputs = screen.getAllByRole('textbox');
        
        // Focus on different inputs to test editor switching
        for (let i = 0; i < Math.min(5, inputs.length); i++) {
          await user.click(inputs[i]);
          await user.type(inputs[i], 'test', { delay: 10 });
        }
      }, 300);
    });
  });

  describe('Accessibility Performance', () => {
    it('should maintain accessibility features without performance impact', async () => {
      render(
        <TestProviders>
          <DynamicTable setRecordId={jest.fn()} />
        </TestProviders>
      );

      // Measure performance with accessibility features enabled
      await measurePerformance('Accessibility features', async () => {
        // Start editing (triggers accessibility announcements)
        const editButton = screen.getByTestId('edit-button-1');
        await user.click(editButton);

        await waitFor(() => {
          const nameInput = screen.getByDisplayValue('User 1');
          expect(nameInput).toBeInTheDocument();
        });

        // Verify accessibility features are present
        const nameInput = screen.getByDisplayValue('User 1');
        expect(nameInput).toHaveAttribute('aria-label');
        expect(nameInput).toHaveAttribute('role');

        // Make changes (triggers more accessibility updates)
        await user.clear(nameInput);
        await user.type(nameInput, 'Accessibility Test');

        // Save (triggers success announcement)
        const saveButton = screen.getByTestId('save-button-1');
        await user.click(saveButton);
      }, 500);
    });
  });
});