import React from 'react';
import { Box, Button, Tooltip } from '@mui/material';
import IconButton from '../';
import { theme } from '../../../theme';
import { ToolbarButton } from '@workspaceui/storybook/stories/Components/Table/types';

interface CompoundButtonProps {
  mainButton: ToolbarButton;
  secondaryButton: ToolbarButton;
}

const CompoundButton: React.FC<CompoundButtonProps> = ({
  mainButton,
  secondaryButton,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title={mainButton.tooltip}>
        <Button
          onClick={mainButton.onClick}
          sx={{
            padding: '0.25rem 0.75rem',
            background: theme.palette.baselineColor.neutral[100],
            borderRadius: '6.25rem',
            minWidth: '6.25rem',
            color: theme.palette.baselineColor.neutral[0],
            marginRight: '0.25rem',
            '&:hover': {
              background: theme.palette.dynamicColor.main,
            },
          }}>
          {React.cloneElement(mainButton.icon as React.ReactElement, {
            width: mainButton.width,
            height: mainButton.height,
          })}
          <span style={{ marginLeft: '0.5rem' }}>{mainButton.tooltip}</span>
        </Button>
      </Tooltip>
      <IconButton {...secondaryButton} />
    </Box>
  );
};

export default CompoundButton;
