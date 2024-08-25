import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Outlet } from 'react-router-dom';
import { Box, theme } from '@workspaceui/componentlibrary/src/components';
import { createToolbarConfig } from '@workspaceui/storybook/stories/Components/Table/toolbarMock';
import {
  CONTENT,
  LABELS,
} from '@workspaceui/componentlibrary/src/components/Table/tableConstants';
import { widgets } from '@workspaceui/storybook/stories/Components/Table/mockWidget';
import SideIcon from '@workspaceui/componentlibrary/src/assets/icons/codesandbox.svg';
import { tableStyles } from '@workspaceui/componentlibrary/src/components/Table/styles';
import { createFormViewToolbarConfig } from '@workspaceui/storybook/stories/Components/Table/toolbarFormviewMock';
import ResizableRecordContainer from '@workspaceui/componentlibrary/src/components/Table/TabNavigation';
import BackgroundGradientUrl from '@workspaceui/componentlibrary/src/assets/images/sidebar-bg.svg?url';
import TopToolbar from '@workspaceui/componentlibrary/src/components/Table/Toolbar';
import Sidebar from '@workspaceui/componentlibrary/src/components/Table/Sidebar';
import { Paper } from '@mui/material';
import { useRecordContext } from '../../contexts/record';
import styles from './styles';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [setRecordContainerHeight] = useState(0);
  const { selectedRecord, getFormattedRecord } = useRecordContext();
  const formattedRecord = getFormattedRecord(selectedRecord);
  const { id = '' } = useParams();

  const paperStyles = useMemo(
    () =>
      ({
        ...tableStyles.sidebarPaper,
        backgroundImage: `url(${BackgroundGradientUrl})`,
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)',
        visibility: isSidebarOpen ? 'visible' : 'hidden',
      }) as const,
    [isSidebarOpen],
  );

  const tablePaper = useMemo(
    () =>
      ({
        ...tableStyles.tablePaper,
        width: isSidebarOpen ? 'calc(68% - 0.5rem)' : '100%',
      }) as const,
    [isSidebarOpen],
  );

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

  const toolbarConfig = useMemo(
    () =>
      id
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
      handleCancel,
      handleSave,
      id,
      isDropdownOpen,
      isSidebarOpen,
      toggleDropdown,
      toggleSidebar,
    ],
  );

  return (
    <Box sx={styles.container}>
      <Box flexShrink={0}>
        <TopToolbar {...toolbarConfig} isItemSelected={!!selectedRecord} />
      </Box>
      <Box
        flexGrow={1}
        display="flex"
        overflow="hidden"
        sx={{ marginTop: '0.25rem' }}>
        <Box sx={tablePaper}>
          <Outlet />
        </Box>
        <Paper elevation={4} sx={paperStyles}>
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={toggleSidebar}
            selectedItem={{
              icon: (
                <SideIcon fill={theme.palette.baselineColor.neutral[100]} />
              ),
              identifier: formattedRecord?.identifier ?? LABELS.NO_IDENTIFIER,
              title: CONTENT.CURRENT_TITLE ?? LABELS.NO_TITLE,
            }}
            widgets={widgets}
          />
        </Paper>
      </Box>
      <ResizableRecordContainer
        isOpen={isDropdownOpen}
        onClose={toggleDropdown}
        selectedRecord={{
          identifier: formattedRecord?.identifier,
          type: formattedRecord?.type,
        }}
        onHeightChange={setRecordContainerHeight}
      />
    </Box>
  );
};

export default Home;
