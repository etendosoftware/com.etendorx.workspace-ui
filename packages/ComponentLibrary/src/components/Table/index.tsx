import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import {
  MaterialReactTable,
  MRT_Row,
  MRT_TableOptions,
  useMaterialReactTable,
} from 'material-react-table';
import { Box, Paper } from '@mui/material';
import {
  Organization,
  TableProps,
  SelectedRecord,
} from '../../../../storybook/src/stories/Components/Table/types';
import { tableStyles } from './styles';
import { theme } from '../../theme';
import { getColumns } from '../../../../storybook/src/stories/Components/Table/columns';
import TopToolbar from './Toolbar';
import BackgroundGradientUrl from '../../assets/images/sidebar-bg.svg?url';
import SideIcon from '../../assets/icons/codesandbox.svg';
import Sidebar from './Sidebar';
import { createToolbarConfig } from '../../../../storybook/src/stories/Components/Table/toolbarMock';
import { CONTENT, LABELS } from './tableConstants';
import ResizableRecordContainer from './TabNavigation';
import { widgets } from '../../../../storybook/src/stories/Components/Table/mockWidget';
import FormView from '../FormView';
import { createFormViewToolbarConfig } from '@workspaceui/storybook/stories/Components/Table/toolbarFormviewMock';
import { ensureString } from '../../helpers/ensureString';

const Table: React.FC<TableProps> = ({ data }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Organization | null>(null);
  const [recordContainerHeight, setRecordContainerHeight] = useState(40);
  const [showFormView, setShowFormView] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleRowClick = useCallback(
    (row: MRT_Row<{ [key: string]: any }>) => {
      const originalItem = data.find(item => item.id.value === row.original.id);
      setSelectedItem(originalItem || null);
    },
    [data],
  );

  const handleOutsideClick = useCallback(
    (event: MouseEvent) => {
      if (
        !showFormView &&
        tableRef.current &&
        !tableRef.current.contains(event.target as Node)
      ) {
        setSelectedItem(null);
      }
    },
    [showFormView],
  );

  const handleRowDoubleClick = useCallback(
    (row: MRT_Row<{ [key: string]: any }>) => {
      const originalItem = data.find(item => item.id.value === row.original.id);
      setSelectedItem(originalItem || null);
      setShowFormView(true);
      // TODO: update the route for the breadcrum
    },
    [data],
  );

  const handleSave = useCallback(() => {
    setShowFormView(false);
  }, []);

  const handleCancel = useCallback(() => {
    setShowFormView(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [handleOutsideClick]);

  const columns = useMemo(() => getColumns(), []);

  const tableData = useMemo(() => {
    return data.map(item => {
      const flatItem: { [key: string]: any } = {};
      for (const [key, field] of Object.entries(item)) {
        flatItem[key] = field.value;
      }
      return flatItem;
    });
  }, [data]);

  const table = useMaterialReactTable({
    columns,
    data: tableData,
    enableTopToolbar: false,
    initialState: {
      density: 'compact',
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowClick(row),
      onDoubleClick: () => handleRowDoubleClick(row),
      sx: tableStyles.tableBodyRow,
    }),
    muiTableBodyProps: {
      sx: tableStyles.tableBody,
    },
    muiTableHeadCellProps: {
      sx: tableStyles.tableHeadCell,
    },
    muiTableBodyCellProps: {
      sx: tableStyles.tableBodyCell,
    },
    columnResizeMode: 'onChange',
  } as MRT_TableOptions<{ [key: string]: any }>);

  const toolbarConfig = useMemo(
    () =>
      showFormView
        ? createFormViewToolbarConfig(
            handleSave,
            handleCancel,
            toggleDropdown,
            toggleSidebar,
            isDropdownOpen,
            isSidebarOpen,
          )
        : createToolbarConfig(
            toggleDropdown,
            toggleSidebar,
            isDropdownOpen,
            isSidebarOpen,
          ),
    [
      showFormView,
      isDropdownOpen,
      isSidebarOpen,
      toggleDropdown,
      toggleSidebar,
      handleSave,
      handleCancel,
    ],
  );

  const renderContent = () => {
    if (showFormView && selectedItem) {
      return (
        <Box sx={{ maxHeight: '40rem' }}>
          <FormView
            data={selectedItem}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </Box>
      );
    } else {
      return <MaterialReactTable table={table} />;
    }
  };

  const selectedRecord: SelectedRecord = {
    identifier:
      ensureString(selectedItem?.documentNo.value) || LABELS.NO_IDENTIFIER,
    type:
      ensureString(selectedItem?.transactionDocument.value) || LABELS.NO_TYPE,
  };

  return (
    <Box sx={tableStyles.container} ref={tableRef}>
      <TopToolbar {...toolbarConfig} isItemSelected={!!selectedItem} />
      <Box
        sx={{
          ...tableStyles.contentContainer,
          height: `calc(100% - ${isDropdownOpen ? recordContainerHeight : 0}vh)`,
        }}>
        <Paper
          elevation={4}
          sx={{
            ...tableStyles.tablePaper,
            width: isSidebarOpen ? 'calc(70% - 0.5rem)' : '100%',
          }}>
          {renderContent()}
        </Paper>
        <Paper
          elevation={4}
          sx={{
            ...tableStyles.sidebarPaper,
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)',
            backgroundImage: `url(${BackgroundGradientUrl})`,
            visibility: isSidebarOpen ? 'visible' : 'hidden',
          }}>
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={toggleSidebar}
            selectedItem={{
              icon: (
                <SideIcon fill={theme.palette.baselineColor.neutral[100]} />
              ),
              identifier: selectedRecord.identifier,
              title: CONTENT.CURRENT_TITLE ?? LABELS.NO_TITLE,
            }}
            widgets={widgets}
          />
        </Paper>
        <ResizableRecordContainer
          isOpen={isDropdownOpen}
          onClose={toggleDropdown}
          selectedRecord={selectedRecord}
          onHeightChange={setRecordContainerHeight}
        />
      </Box>
    </Box>
  );
};

export default Table;
