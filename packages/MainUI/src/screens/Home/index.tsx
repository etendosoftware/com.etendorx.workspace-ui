import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams, Outlet } from 'react-router-dom';
import { Box, theme } from '@workspaceui/componentlibrary/src/components';
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
import useRecordContext from '../../hooks/useRecordContext'

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem] = useState<Organization | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const { selectedRecord } = useRecordContext();
  const { id = '' } = useParams();

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

  const selectedRecord = useMemo(
    () => ({
      identifier:
        ensureString(selectedItem?.documentNo?.value) || LABELS.NO_IDENTIFIER,
      type:
        ensureString(selectedItem?.transactionDocument?.value) ||
        LABELS.NO_TYPE,
    }),
    [selectedItem?.documentNo?.value, selectedItem?.transactionDocument?.value],
  );

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
            <Outlet />
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
        />
      </Box>
    </Box>
  );
};

export default Home;
