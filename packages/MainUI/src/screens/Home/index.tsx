import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { useNavigate, useParams, useOutlet } from 'react-router-dom';
import { Box, theme } from '@workspaceui/componentlibrary/src/components';
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
import Table from '@workspaceui/componentlibrary/src/components/Table';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const outlet = useOutlet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Organization | null>(null);
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

  const handleRowClick = useCallback(row => {
    const originalItem = mockOrganizations.find(
      item => item.id.value === row.original.id,
    );
    setSelectedItem(originalItem || null);
  }, []);

  const handleRowDoubleClick = useCallback(
    row => {
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

  const contextValue = {
    selectedItem,
    onSave: handleSave,
    onCancel: handleCancel,
  };

  return (
    <Box sx={tableStyles.container} ref={tableRef}>
      <Box height="100%" overflow="auto">
        <TopToolbar {...toolbarConfig} isItemSelected={!!selectedItem} />
        <Box sx={tableStyles.contentContainer}>
          <Box
            sx={{
              ...tableStyles.tablePaper,
              width: isSidebarOpen ? 'calc(68% - 0.5rem)' : '100%',
            }}>
            {isFormView ? (
              React.cloneElement(outlet as React.ReactElement, contextValue)
            ) : (
              <Table
                data={mockOrganizations}
                isTreeStructure={false}
                onRowClick={handleRowClick}
                onRowDoubleClick={handleRowDoubleClick}
              />
            )}
          </Box>
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
        </Box>
        <ResizableRecordContainer
          isOpen={isDropdownOpen}
          onClose={toggleDropdown}
          selectedRecord={selectedRecord}
        />
      </Box>
    </Box>
  );
};

export default Home;
