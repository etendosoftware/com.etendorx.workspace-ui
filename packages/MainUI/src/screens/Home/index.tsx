import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Table,
  theme,
} from '@workspaceui/componentlibrary/src/components';
import { mockOrganizations } from '@workspaceui/storybook/mocks';
import { createToolbarConfig } from '@workspaceui/storybook/stories/Components/Table/toolbarMock';
import { Organization } from '@workspaceui/storybook/stories/Components/Table/types';
import {
  CONTENT,
  LABELS,
} from '@workspaceui/componentlibrary/src/components/Table/tableConstants';
import { ensureString } from '@workspaceui/componentlibrary/src/helpers/ensureString';
import { widgets } from '@workspaceui/storybook/stories/Components/Table/mockWidget';
import SideIcon from '@workspaceui/componentlibrary/src/assets/icons/codesandbox.svg';
import { tableStyles } from '@workspaceui/componentlibrary/src/components/Table/styles';
import { createFormViewToolbarConfig } from '@workspaceui/storybook/stories/Components/Table/toolbarFormviewMock';
import ResizableRecordContainer from '@workspaceui/componentlibrary/src/components/Table/TabNavigation';
import BackgroundGradientUrl from '@workspaceui/componentlibrary/src/assets/images/sidebar-bg.svg?url';
import TopToolbar from '@workspaceui/componentlibrary/src/components/Table/Toolbar';
import Sidebar from '@workspaceui/componentlibrary/src/components/Table/Sidebar';
import { Paper } from '@mui/material';
import FormView from '@workspaceui/componentlibrary/src/components/FormView';
import { MRT_Row } from 'material-react-table';

interface ContentProps {
  isFormView: boolean;
  selectedItem: Organization | null;
  isSidebarOpen: boolean;
  handleSave: () => void;
  handleCancel: () => void;
  mockOrganizations: Organization[];
  handleRowClick: (row: MRT_Row<{ [key: string]: any }>) => void;
  handleRowDoubleClick: (row: MRT_Row<{ [key: string]: any }>) => void;
}

const Content: React.FC<ContentProps> = ({
  isFormView,
  selectedItem,
  isSidebarOpen,
  handleSave,
  handleCancel,
  mockOrganizations,
  handleRowClick,
  handleRowDoubleClick,
}) => {
  if (isFormView && selectedItem) {
    return (
      <Box
        sx={{
          ...tableStyles.tablePaper,
          width: isSidebarOpen ? 'calc(68% - 0.5rem)' : '100%',
        }}>
        <FormView
          data={selectedItem}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </Box>
    );
  } else {
    return (
      <Paper
        sx={{
          ...tableStyles.tablePaper,
          width: isSidebarOpen ? 'calc(68% - 0.5rem)' : '100%',
        }}>
        <Table
          data={mockOrganizations}
          isTreeStructure={false}
          onRowClick={handleRowClick}
          onRowDoubleClick={handleRowDoubleClick}
        />
      </Paper>
    );
  }
};

const Home = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Organization | null>(null);
  const [recordContainerHeight, setRecordContainerHeight] = useState(40);
  const tableRef = useRef<HTMLDivElement>(null);

  const isFormView = !!id;

  useEffect(() => {
    if (isFormView) {
      const item = mockOrganizations.find(org => org.id.value === id);
      setSelectedItem(item || null);
    } else {
      setSelectedItem(null);
    }
  }, [id, isFormView]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleSave = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleCancel = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleRowClick = useCallback((row: MRT_Row<{ [key: string]: any }>) => {
    const originalItem = mockOrganizations.find(
      item => item.id.value === row.original.id,
    );
    setSelectedItem(originalItem || null);
  }, []);

  const handleRowDoubleClick = useCallback(
    (row: MRT_Row<{ [key: string]: any }>) => {
      const originalItem = mockOrganizations.find(
        item => item.id.value === row.original.id,
      );
      if (originalItem) {
        navigate(`/${originalItem.id.value}`);
      }
    },
    [navigate],
  );

  const handleOutsideClick = useCallback(
    (event: MouseEvent) => {
      if (
        !isFormView &&
        tableRef.current &&
        !tableRef.current.contains(event.target as Node)
      ) {
        setSelectedItem(null);
      }
    },
    [isFormView],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [handleOutsideClick]);

  const toolbarConfig = useMemo(
    () =>
      isFormView
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
      isFormView,
      isDropdownOpen,
      isSidebarOpen,
      toggleDropdown,
      toggleSidebar,
      handleSave,
      handleCancel,
    ],
  );

  const selectedRecord = {
    identifier:
      ensureString(selectedItem?.documentNo?.value) || LABELS.NO_IDENTIFIER,
    type:
      ensureString(selectedItem?.transactionDocument?.value) || LABELS.NO_TYPE,
  };

  return (
    <Box sx={tableStyles.container} ref={tableRef}>
      <Box height="100%" overflow="auto">
        <TopToolbar {...toolbarConfig} isItemSelected={!!selectedItem} />
        <Box sx={tableStyles.contentContainer}>
          <Box
            sx={{
              ...tableStyles.contentContainer,
              height: `calc(100% - ${isDropdownOpen ? recordContainerHeight : 0}vh)`,
            }}>
            <Content
              isFormView={isFormView}
              selectedItem={selectedItem}
              isSidebarOpen={isSidebarOpen}
              handleSave={handleSave}
              handleCancel={handleCancel}
              mockOrganizations={mockOrganizations}
              handleRowClick={handleRowClick}
              handleRowDoubleClick={handleRowDoubleClick}
            />
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
      </Box>
    </Box>
  );
};

export default Home;
