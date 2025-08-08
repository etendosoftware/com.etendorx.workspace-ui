# Process Execution Components

This document provides comprehensive documentation for all components involved in process execution, including their interfaces, behaviors, patterns, and usage examples.

## Overview

The process execution component system is built on a modular, composable architecture that supports various parameter types, validation patterns, and execution workflows. Components are designed to be reusable, testable, and maintainable.

## Component Hierarchy

```
ProcessDefinitionModal
├── ProcessParameterRenderer
│   ├── WindowReferenceGrid
│   │   ├── ProcessDataGrid
│   │   ├── GridSelectionControls
│   │   └── GridPagination
│   ├── BaseSelector
│   │   ├── DateSelector
│   │   ├── BooleanSelector
│   │   ├── NumericSelector
│   │   ├── TextSelector
│   │   └── ListSelector
│   └── GenericSelector (fallback)
├── ProcessExecutionControls
│   ├── ExecuteButton
│   ├── CancelButton
│   └── ProgressIndicator
└── ProcessResponseDisplay
    ├── SuccessMessage
    ├── ErrorMessage
    └── WarningMessage
```

## Core Components

### ProcessDefinitionModal

The main component that orchestrates the entire process execution workflow.

**File**: `packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx`

#### Interface

```typescript
interface ProcessDefinitionModalProps {
  onClose: () => void;
  open: boolean;
  button?: ProcessDefinitionButton | null;
  onSuccess?: () => void;
  onError?: (error: ProcessExecutionError) => void;
  className?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
}

interface ProcessDefinitionModalState {
  parameters: ProcessParameters;
  response: ResponseMessage | undefined;
  isExecuting: boolean;
  isSuccess: boolean;
  loading: boolean;
  gridSelection: EntityData[];
  formValues: Record<string, EntityValue>;
  validationErrors: Record<string, ValidationError[]>;
}
```

#### Key Features

- **Dynamic Parameter Rendering**: Automatically renders appropriate components based on parameter types
- **State Management**: Centralized state management for the entire process workflow
- **Validation Integration**: Built-in validation with real-time feedback
- **Progress Tracking**: Visual feedback during process execution
- **Error Handling**: Comprehensive error handling with user-friendly messages

#### Implementation

```typescript
function ProcessDefinitionModal({ onClose, button, open, onSuccess, onError }: ProcessDefinitionModalProps) {
  const { t } = useTranslation();
  const { tab, record } = useTabContext();
  const { session } = useUserContext();
  const form = useForm<ProcessFormValues>();

  // State management
  const [state, setState] = useState<ProcessDefinitionModalState>({
    parameters: button?.processDefinition.parameters || {},
    response: undefined,
    isExecuting: false,
    isSuccess: false,
    loading: true,
    gridSelection: [],
    formValues: {},
    validationErrors: {}
  });

  // Process configuration
  const {
    config: processConfig,
    loading: configLoading,
    error: configError,
    fetchConfig
  } = useProcessConfig({
    processId: button?.processDefinition.id || '',
    windowId: tab?.window || '',
    tabId: tab?.id || ''
  });

  // Parameter validation
  const { validateParameters, validationErrors } = useProcessValidation(
    state.parameters,
    state.formValues
  );

  // Process execution
  const { executeProcess, executionState } = useProcessExecution({
    processDefinition: button?.processDefinition,
    onSuccess,
    onError
  });

  // Event handlers
  const handleParameterChange = useCallback((parameterId: string, value: EntityValue) => {
    setState(prev => ({
      ...prev,
      formValues: {
        ...prev.formValues,
        [parameterId]: value
      }
    }));
    
    // Trigger validation
    validateParameters({ ...state.formValues, [parameterId]: value });
  }, [state.formValues, validateParameters]);

  const handleExecute = useCallback(async () => {
    if (!button?.processDefinition) return;

    const validationResult = await validateParameters(state.formValues);
    if (!validationResult.valid) {
      setState(prev => ({ ...prev, validationErrors: validationResult.errors }));
      return;
    }

    await executeProcess({
      parameters: state.formValues,
      gridSelection: state.gridSelection,
      context: {
        windowId: tab?.window || '',
        tabId: tab?.id || '',
        recordId: record?.id,
        user: session,
        selectedRecords: []
      }
    });
  }, [button, state.formValues, state.gridSelection, validateParameters, executeProcess]);

  // Render methods
  const renderParameters = () => {
    return Object.values(state.parameters).map(parameter => (
      <ProcessParameterRenderer
        key={parameter.id}
        parameter={parameter}
        value={state.formValues[parameter.id]}
        onChange={(value) => handleParameterChange(parameter.id, value)}
        error={state.validationErrors[parameter.id]?.[0]?.message}
        processConfig={processConfig}
        gridSelection={state.gridSelection}
        onGridSelectionChange={(selection) => 
          setState(prev => ({ ...prev, gridSelection: selection }))
        }
      />
    ));
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <FormProvider {...form}>
        <ProcessModalContent>
          <ProcessModalHeader>
            <Typography variant="h6">{button?.name}</Typography>
            <IconButton onClick={onClose} disabled={state.isExecuting}>
              <CloseIcon />
            </IconButton>
          </ProcessModalHeader>

          <ProcessModalBody>
            {state.loading && <ProcessLoadingIndicator />}
            {state.response && <ProcessResponseDisplay response={state.response} />}
            {!state.loading && renderParameters()}
          </ProcessModalBody>

          <ProcessModalFooter>
            <ProcessExecutionControls
              onExecute={handleExecute}
              onCancel={onClose}
              isExecuting={state.isExecuting}
              isSuccess={state.isSuccess}
              canExecute={validationErrors.length === 0}
            />
          </ProcessModalFooter>
        </ProcessModalContent>
      </FormProvider>
    </Modal>
  );
}
```

### ProcessParameterRenderer

Component responsible for rendering the appropriate input component based on parameter type.

#### Interface

```typescript
interface ProcessParameterRendererProps {
  parameter: ProcessParameter;
  value?: EntityValue;
  onChange: (value: EntityValue) => void;
  error?: string;
  disabled?: boolean;
  processConfig?: ProcessConfigResponse;
  gridSelection?: EntityData[];
  onGridSelectionChange?: (selection: EntityData[]) => void;
  context?: ProcessContext;
}
```

#### Implementation

```typescript
const ProcessParameterRenderer: React.FC<ProcessParameterRendererProps> = ({
  parameter,
  value,
  onChange,
  error,
  disabled = false,
  processConfig,
  gridSelection = [],
  onGridSelectionChange,
  context
}) => {
  const componentProps = {
    parameter,
    value,
    onChange,
    error,
    disabled,
    required: parameter.mandatory
  };

  // Window reference parameter
  if (isWindowReferenceParameter(parameter)) {
    return (
      <WindowReferenceGrid
        {...componentProps}
        processConfig={processConfig}
        selection={gridSelection}
        onSelectionChange={onGridSelectionChange || (() => {})}
        context={context}
      />
    );
  }

  // List parameter (rendered as radio buttons in process context)
  if (isListParameter(parameter)) {
    return (
      <ProcessListSelector
        {...componentProps}
        options={parameter.refList || []}
        renderAs="radio"
      />
    );
  }

  // Date parameter
  if (parameter.reference === FIELD_REFERENCE_CODES.DATE) {
    return <ProcessDateSelector {...componentProps} />;
  }

  // Boolean parameter
  if (parameter.reference === FIELD_REFERENCE_CODES.BOOLEAN) {
    return <ProcessBooleanSelector {...componentProps} />;
  }

  // Numeric parameter
  if (isNumericParameter(parameter)) {
    return (
      <ProcessNumericSelector
        {...componentProps}
        type={getNumericType(parameter.reference)}
        precision={getNumericPrecision(parameter.reference)}
      />
    );
  }

  // Fallback to generic selector
  return <ProcessGenericSelector {...componentProps} />;
};
```

### WindowReferenceGrid

Enhanced grid component for window reference parameters with advanced features.

#### Interface

```typescript
interface WindowReferenceGridProps {
  parameter: ProcessParameter;
  processConfig?: ProcessConfigResponse;
  selection: EntityData[];
  onSelectionChange: (selection: EntityData[]) => void;
  context?: ProcessContext;
  error?: string;
  disabled?: boolean;
  maxHeight?: number;
  virtualScrolling?: boolean;
  searchable?: boolean;
}

interface WindowReferenceGridState {
  data: EntityData[];
  loading: boolean;
  error: Error | null;
  filters: Record<string, EntityValue>;
  sorting: SortingState[];
  pagination: PaginationState;
  hasMore: boolean;
}
```

#### Enhanced Features

```typescript
const WindowReferenceGrid: React.FC<WindowReferenceGridProps> = ({
  parameter,
  processConfig,
  selection,
  onSelectionChange,
  context,
  error,
  disabled = false,
  maxHeight = 400,
  virtualScrolling = true,
  searchable = true
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<WindowReferenceGridState>({
    data: [],
    loading: true,
    error: null,
    filters: {},
    sorting: [],
    pagination: { pageIndex: 0, pageSize: 100 },
    hasMore: true
  });

  // Grid configuration
  const gridConfig = useMemo(() => {
    if (!parameter.window?.tabs[0]) return null;
    
    const adapter = new GridConfigurationAdapter();
    return adapter.adapt(parameter.window.tabs[0], {
      context,
      filters: processConfig?.filters || []
    });
  }, [parameter.window, processConfig, context]);

  // Data fetching
  const {
    data,
    loading,
    error: fetchError,
    hasNextPage,
    fetchNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['windowReferenceData', parameter.id, state.filters, state.sorting],
    queryFn: ({ pageParam = 0 }) => fetchGridData({
      entityName: parameter.window?.tabs[0]?.entityName || '',
      filters: state.filters,
      sorting: state.sorting,
      pagination: { pageIndex: pageParam, pageSize: state.pagination.pageSize },
      processConfig
    }),
    getNextPageParam: (lastPage, pages) => 
      lastPage.hasMore ? pages.length : undefined,
    enabled: !!gridConfig
  });

  // Column definitions
  const columns = useMemo(() => {
    if (!gridConfig) return [];
    
    return [
      // Selection column
      {
        id: 'selection',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            disabled={disabled}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            disabled={disabled}
          />
        ),
        size: 50
      },
      // Data columns
      ...gridConfig.columns.map(columnConfig => ({
        accessorKey: columnConfig.field,
        header: columnConfig.header,
        cell: ({ getValue }) => {
          const value = getValue();
          return columnConfig.formatter ? columnConfig.formatter(value) : String(value || '');
        },
        enableSorting: columnConfig.sortable,
        enableColumnFilter: columnConfig.filterable,
        filterFn: getFilterFunction(columnConfig.type),
        size: columnConfig.width
      }))
    ];
  }, [gridConfig, disabled]);

  // Table configuration
  const table = useReactTable({
    data: data?.pages.flatMap(page => page.data) || [],
    columns,
    state: {
      rowSelection: selection.reduce((acc, item) => {
        acc[item.id] = true;
        return acc;
      }, {} as Record<string, boolean>),
      columnFilters: Object.entries(state.filters).map(([id, value]) => ({ id, value })),
      sorting: state.sorting,
      pagination: state.pagination
    },
    onRowSelectionChange: (updaterOrValue) => {
      const newSelection = typeof updaterOrValue === 'function' 
        ? updaterOrValue(selection.reduce((acc, item) => ({ ...acc, [item.id]: true }), {}))
        : updaterOrValue;
      
      const selectedRows = Object.keys(newSelection)
        .filter(key => newSelection[key])
        .map(key => data?.pages.flatMap(page => page.data).find(item => item.id === key))
        .filter(Boolean) as EntityData[];
      
      onSelectionChange(selectedRows);
    },
    onColumnFiltersChange: (updaterOrValue) => {
      const newFilters = typeof updaterOrValue === 'function'
        ? updaterOrValue(Object.entries(state.filters).map(([id, value]) => ({ id, value })))
        : updaterOrValue;
      
      setState(prev => ({
        ...prev,
        filters: newFilters.reduce((acc, { id, value }) => ({ ...acc, [id]: value }), {})
      }));
    },
    onSortingChange: (updaterOrValue) => {
      const newSorting = typeof updaterOrValue === 'function'
        ? updaterOrValue(state.sorting)
        : updaterOrValue;
      
      setState(prev => ({ ...prev, sorting: newSorting }));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: gridConfig?.selection.mode === 'multiple',
    enableSubRowSelection: false
  });

  // Virtual scrolling setup
  const { rows } = table.getRowModel();
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    enabled: virtualScrolling && rows.length > 100
  });

  // Error handling
  if (fetchError || error) {
    return (
      <ProcessErrorDisplay
        title={t('errors.dataLoadingFailed')}
        message={fetchError?.message || error}
        onRetry={refetch}
      />
    );
  }

  return (
    <ProcessParameterContainer>
      <ProcessParameterHeader>
        <Typography variant="subtitle1" fontWeight="medium">
          {parameter.name}
          {parameter.mandatory && <RequiredIndicator />}
        </Typography>
        
        {searchable && (
          <SearchField
            placeholder={t('common.search')}
            onChange={(value) => setState(prev => ({
              ...prev,
              filters: { ...prev.filters, _search: value }
            }))}
          />
        )}
        
        <SelectionSummary
          count={selection.length}
          total={data?.pages[0]?.total || 0}
          onClear={() => onSelectionChange([])}
        />
      </ProcessParameterHeader>

      <ProcessParameterContent style={{ maxHeight }}>
        <div ref={parentRef} className="h-full overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} style={{ width: header.getSize() }}>
                      <div className="flex items-center gap-2 p-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <SortingIndicator
                            direction={header.column.getIsSorted()}
                            onClick={header.column.getToggleSortingHandler()}
                          />
                        )}
                      </div>
                      {header.column.getCanFilter() && (
                        <ColumnFilter column={header.column} />
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            
            <tbody>
              {virtualScrolling ? (
                <VirtualizedRows
                  virtualizer={virtualizer}
                  rows={rows}
                  table={table}
                />
              ) : (
                rows.map(row => (
                  <TableRow
                    key={row.id}
                    row={row}
                    table={table}
                    selected={row.getIsSelected()}
                    onClick={() => row.toggleSelected()}
                  />
                ))
              )}
            </tbody>
          </table>
          
          {loading && <ProcessLoadingOverlay />}
        </div>
      </ProcessParameterContent>

      <ProcessParameterFooter>
        <LoadMoreButton
          onClick={() => fetchNextPage()}
          disabled={!hasNextPage || loading}
          loading={loading}
        >
          {t('common.loadMore')}
        </LoadMoreButton>
        
        <PaginationInfo
          current={data?.pages.flatMap(page => page.data).length || 0}
          total={data?.pages[0]?.total || 0}
        />
      </ProcessParameterFooter>
    </ProcessParameterContainer>
  );
};
```

### ProcessExecutionControls

Component for process execution actions and progress indication.

#### Interface

```typescript
interface ProcessExecutionControlsProps {
  onExecute: () => void;
  onCancel: () => void;
  isExecuting: boolean;
  isSuccess: boolean;
  canExecute: boolean;
  executionProgress?: ExecutionProgress;
  showProgress?: boolean;
}
```

#### Implementation

```typescript
const ProcessExecutionControls: React.FC<ProcessExecutionControlsProps> = ({
  onExecute,
  onCancel,
  isExecuting,
  isSuccess,
  canExecute,
  executionProgress,
  showProgress = true
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {showProgress && executionProgress && (
        <ProcessProgressIndicator
          progress={executionProgress.percentage}
          message={executionProgress.message}
          step={executionProgress.step}
        />
      )}
      
      <div className="flex gap-4">
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={isExecuting}
          fullWidth
        >
          {t('common.cancel')}
        </Button>
        
        <Button
          variant="contained"
          onClick={onExecute}
          disabled={!canExecute || isExecuting}
          fullWidth
          startIcon={isExecuting ? <CircularProgress size={20} /> : <PlayIcon />}
        >
          {isExecuting ? (
            <span className="flex items-center gap-2">
              {t('common.executing')}
              <AnimatedDots />
            </span>
          ) : isSuccess ? (
            <span className="flex items-center gap-2">
              <CheckIcon />
              {t('process.completed')}
            </span>
          ) : (
            t('common.execute')
          )}
        </Button>
      </div>
    </div>
  );
};
```

## Parameter-Specific Components

### ProcessDateSelector

```typescript
interface ProcessDateSelectorProps extends BaseProcessParameterProps {
  format?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
}

const ProcessDateSelector: React.FC<ProcessDateSelectorProps> = ({
  parameter,
  value,
  onChange,
  error,
  disabled,
  format = 'DD-MM-YYYY',
  minDate,
  maxDate,
  disabledDates = []
}) => {
  const { t } = useTranslation();
  const [internalValue, setInternalValue] = useState<Date | null>(
    value ? parseDate(String(value), format) : null
  );

  const handleChange = (date: Date | null) => {
    setInternalValue(date);
    onChange(date ? formatDate(date, format) : null);
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDates.some(disabled => isSameDay(date, disabled))) return true;
    return false;
  };

  return (
    <ProcessParameterContainer>
      <ProcessParameterLabel
        text={parameter.name}
        required={parameter.mandatory}
        help={parameter.description}
      />
      
      <DatePicker
        value={internalValue}
        onChange={handleChange}
        disabled={disabled}
        shouldDisableDate={isDateDisabled}
        format={format}
        slotProps={{
          textField: {
            error: !!error,
            helperText: error,
            fullWidth: true,
            placeholder: format.toLowerCase()
          }
        }}
      />
    </ProcessParameterContainer>
  );
};
```

### ProcessListSelector

```typescript
interface ProcessListSelectorProps extends BaseProcessParameterProps {
  options: RefListOption[];
  renderAs?: 'dropdown' | 'radio' | 'checkbox';
  multiple?: boolean;
  searchable?: boolean;
}

const ProcessListSelector: React.FC<ProcessListSelectorProps> = ({
  parameter,
  value,
  onChange,
  error,
  disabled,
  options,
  renderAs = 'dropdown',
  multiple = false,
  searchable = false
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option => 
      option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.searchKey.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const handleChange = (newValue: string | string[]) => {
    onChange(multiple ? newValue : newValue);
  };

  if (renderAs === 'radio') {
    return (
      <ProcessParameterContainer>
        <ProcessParameterLabel
          text={parameter.name}
          required={parameter.mandatory}
          help={parameter.description}
        />
        
        <RadioGroup
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
        >
          {filteredOptions.map(option => (
            <FormControlLabel
              key={option.id}
              value={option.value}
              control={<Radio disabled={disabled || !option.enabled} />}
              label={
                <div>
                  <Typography variant="body2">{option.name}</Typography>
                  {option.description && (
                    <Typography variant="caption" color="textSecondary">
                      {option.description}
                    </Typography>
                  )}
                </div>
              }
            />
          ))}
        </RadioGroup>
        
        {error && (
          <FormHelperText error>{error}</FormHelperText>
        )}
      </ProcessParameterContainer>
    );
  }

  return (
    <ProcessParameterContainer>
      <ProcessParameterLabel
        text={parameter.name}
        required={parameter.mandatory}
        help={parameter.description}
      />
      
      {searchable && (
        <TextField
          placeholder={t('common.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: <SearchIcon />,
            endAdornment: searchTerm && (
              <IconButton size="small" onClick={() => setSearchTerm('')}>
                <ClearIcon />
              </IconButton>
            )
          }}
        />
      )}
      
      <FormControl fullWidth error={!!error}>
        <Select
          value={multiple ? (Array.isArray(value) ? value : []) : (value || '')}
          onChange={(e) => handleChange(e.target.value)}
          multiple={multiple}
          disabled={disabled}
          displayEmpty
          renderValue={multiple ? 
            (selected) => (
              <div className="flex flex-wrap gap-1">
                {(selected as string[]).map(val => {
                  const option = options.find(opt => opt.value === val);
                  return (
                    <Chip
                      key={val}
                      label={option?.name || val}
                      size="small"
                      onDelete={() => {
                        const newValue = (selected as string[]).filter(v => v !== val);
                        handleChange(newValue);
                      }}
                    />
                  );
                })}
              </div>
            ) :
            (selected) => {
              if (!selected) return <em>{t('common.selectOption')}</em>;
              const option = options.find(opt => opt.value === selected);
              return option?.name || selected;
            }
          }
        >
          {filteredOptions.map(option => (
            <MenuItem
              key={option.id}
              value={option.value}
              disabled={!option.enabled}
            >
              <div className="flex items-center gap-2">
                {multiple && (
                  <Checkbox
                    checked={Array.isArray(value) && value.includes(option.value)}
                  />
                )}
                <div>
                  <Typography variant="body2">{option.name}</Typography>
                  {option.description && (
                    <Typography variant="caption" color="textSecondary">
                      {option.description}
                    </Typography>
                  )}
                </div>
              </div>
            </MenuItem>
          ))}
        </Select>
        
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>
    </ProcessParameterContainer>
  );
};
```

## Utility Components

### ProcessParameterContainer

```typescript
interface ProcessParameterContainerProps {
  children: React.ReactNode;
  className?: string;
  spacing?: number;
}

const ProcessParameterContainer: React.FC<ProcessParameterContainerProps> = ({
  children,
  className = '',
  spacing = 2
}) => {
  return (
    <div className={`flex flex-col gap-${spacing} ${className}`}>
      {children}
    </div>
  );
};
```

### ProcessParameterLabel

```typescript
interface ProcessParameterLabelProps {
  text: string;
  required?: boolean;
  help?: string;
  htmlFor?: string;
}

const ProcessParameterLabel: React.FC<ProcessParameterLabelProps> = ({
  text,
  required = false,
  help,
  htmlFor
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={htmlFor} className="font-medium text-sm">
        {text}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {help && (
        <Tooltip title={help} open={showHelp} onClose={() => setShowHelp(false)}>
          <IconButton
            size="small"
            onClick={() => setShowHelp(!showHelp)}
            className="p-1"
          >
            <HelpIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
};
```

### ProcessLoadingIndicator

```typescript
interface ProcessLoadingIndicatorProps {
  message?: string;
  progress?: number;
  step?: string;
  size?: 'small' | 'medium' | 'large';
}

const ProcessLoadingIndicator: React.FC<ProcessLoadingIndicatorProps> = ({
  message,
  progress,
  step,
  size = 'medium'
}) => {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      {progress !== undefined ? (
        <div className="w-full max-w-xs">
          <LinearProgress
            variant="determinate"
            value={progress}
            className="h-2 rounded"
          />
          <div className="flex justify-between mt-1 text-xs text-gray-600">
            <span>{step}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      ) : (
        <CircularProgress size={size === 'small' ? 20 : size === 'large' ? 48 : 32} />
      )}
      
      {message && (
        <Typography variant="body2" color="textSecondary" align="center">
          {message}
        </Typography>
      )}
    </div>
  );
};
```

## Component Testing Patterns

### Unit Testing

```typescript
describe('ProcessDefinitionModal', () => {
  const mockButton: ProcessDefinitionButton = {
    id: 'test-button',
    name: 'Test Process',
    processDefinition: {
      id: 'test-process',
      name: 'Test Process',
      javaClassName: 'TestProcess',
      parameters: {
        testParam: {
          id: 'testParam',
          name: 'Test Parameter',
          reference: FIELD_REFERENCE_CODES.TEXT,
          mandatory: true
        }
      },
      onLoad: '',
      onProcess: ''
    }
  };

  it('renders process parameters correctly', () => {
    render(
      <ProcessDefinitionModal
        open={true}
        button={mockButton}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Test Process')).toBeInTheDocument();
    expect(screen.getByText('Test Parameter')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument(); // Required indicator
  });

  it('validates required parameters', async () => {
    const user = userEvent.setup();
    render(
      <ProcessDefinitionModal
        open={true}
        button={mockButton}
        onClose={jest.fn()}
      />
    );

    const executeButton = screen.getByRole('button', { name: /execute/i });
    await user.click(executeButton);

    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  it('calls onSuccess when process completes successfully', async () => {
    const onSuccess = jest.fn();
    const user = userEvent.setup();
    
    // Mock successful API response
    mockApiCall.mockResolvedValueOnce({
      success: true,
      message: { msgType: 'success', msgTitle: 'Success', msgText: 'Process completed' }
    });

    render(
      <ProcessDefinitionModal
        open={true}
        button={mockButton}
        onClose={jest.fn()}
        onSuccess={onSuccess}
      />
    );

    const input = screen.getByLabelText('Test Parameter');
    await user.type(input, 'test value');

    const executeButton = screen.getByRole('button', { name: /execute/i });
    await user.click(executeButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

### Integration Testing

```typescript
describe('Process Execution Integration', () => {
  it('completes full process execution flow', async () => {
    const user = userEvent.setup();
    
    // Setup mocks
    mockProcessDefinitionAPI();
    mockProcessConfigurationAPI();
    mockProcessExecutionAPI();

    render(<ProcessExecutionTestHarness />);

    // Open process modal
    const processButton = screen.getByText('Copy from Order');
    await user.click(processButton);

    // Wait for modal to load
    await waitFor(() => {
      expect(screen.getByText('Source Order')).toBeInTheDocument();
    });

    // Select records in grid
    const firstRow = screen.getByTestId('grid-row-0');
    await user.click(firstRow);

    // Execute process
    const executeButton = screen.getByRole('button', { name: /execute/i });
    await user.click(executeButton);

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/process completed successfully/i)).toBeInTheDocument();
    });
  });
});
```

## Performance Optimization Patterns

### Component Memoization

```typescript
// Memoize expensive parameter renderer
const MemoizedProcessParameterRenderer = React.memo(ProcessParameterRenderer, (prevProps, nextProps) => {
  return (
    prevProps.parameter.id === nextProps.parameter.id &&
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.disabled === nextProps.disabled
  );
});

// Memoize grid with virtual scrolling
const MemoizedWindowReferenceGrid = React.memo(WindowReferenceGrid, (prevProps, nextProps) => {
  return (
    prevProps.parameter.id === nextProps.parameter.id &&
    JSON.stringify(prevProps.selection) === JSON.stringify(nextProps.selection) &&
    prevProps.disabled === nextProps.disabled
  );
});
```

### Callback Optimization

```typescript
const ProcessDefinitionModal = ({ button, onClose, onSuccess }) => {
  // Memoize event handlers
  const handleParameterChange = useCallback((parameterId: string, value: EntityValue) => {
    setFormValues(prev => ({ ...prev, [parameterId]: value }));
  }, []);

  const handleGridSelectionChange = useCallback((selection: EntityData[]) => {
    setGridSelection(selection);
  }, []);

  const handleExecute = useCallback(async () => {
    // Execution logic
  }, [/* dependencies */]);

  // Memoize rendered parameters
  const renderedParameters = useMemo(() => {
    return Object.values(parameters).map(parameter => (
      <MemoizedProcessParameterRenderer
        key={parameter.id}
        parameter={parameter}
        value={formValues[parameter.id]}
        onChange={handleParameterChange}
        onGridSelectionChange={handleGridSelectionChange}
      />
    ));
  }, [parameters, formValues, handleParameterChange, handleGridSelectionChange]);

  return (
    <Modal open={open} onClose={onClose}>
      {renderedParameters}
    </Modal>
  );
};
```

This comprehensive component documentation provides developers with everything they need to understand, implement, extend, and maintain the process execution component system.
