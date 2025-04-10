import { forwardRef, useCallback, useMemo } from 'react';
import { Menu, MenuItem, Tooltip } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { ProcessMenuProps } from './types';
import { ProcessButton } from '../ProcessModal/types';
import { useParentTabContext } from '@/contexts/tab';
import { useUserContext } from '@/hooks/useUserContext';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { compileExpression } from '../Form/FormView/selectors/BaseSelector';

const menuStyle = {
  marginTop: '0.5rem',
  paddingY: 0,
  '& .MuiPaper-root': {
    borderRadius: '0.75rem',
    background: theme.palette.baselineColor.neutral[5],
  },
};

const menuItemStyle = {
  display: 'flex',
  width: 'auto',
  margin: '0.5rem',
  padding: '0.5rem',
  borderRadius: '0.5rem',
  '&:hover': {
    background: theme.palette.baselineColor.neutral[20],
    color: theme.palette.baselineColor.neutral[90],
  },
};

interface ProcessMenuItemProps {
  button: ProcessButton;
  onProcessClick: (button: ProcessButton) => void;
  disabled: boolean;
}

const ProcessMenuItem = forwardRef<HTMLLIElement, ProcessMenuItemProps>(
  ({ button, onProcessClick, disabled }: ProcessMenuItemProps, ref) => {
    const field = (button as unknown as { field: Field }).field;
    const { session } = useUserContext();
    const { selected } = useMetadataContext();
    const { tab } = useParentTabContext();

    const isDisplayed: boolean = useMemo(() => {
      if (!tab) {
        return false;
      }

      if (!field.displayed) return false;

      if (!field.displayLogicExpression) return true;

      const compiledExpr = compileExpression(field.displayLogicExpression);

      try {
        const values = selected[tab.level];
        return compiledExpr(session, values);
      } catch (error) {
        return true;
      }
    }, [tab, selected, field, session]);

    const handleClick = useCallback(() => {
      onProcessClick(button);
    }, [button, onProcessClick]);

    if (!isDisplayed) {
      return null;
    }

    return (
      <Tooltip title={button.name} enterDelay={2000} leaveDelay={100}>
        <MenuItem onClick={handleClick} sx={menuItemStyle} disabled={disabled} ref={ref}>
          <span>{button.name}</span>
        </MenuItem>
      </Tooltip>
    );
  },
);

ProcessMenuItem.displayName = 'ProcessMenuItem';

const ProcessMenu: React.FC<ProcessMenuProps> = ({
  anchorEl,
  open,
  onClose,
  processButtons,
  onProcessClick,
  selectedRecord,
}) => {
  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose} sx={menuStyle}>
      {processButtons.map((button: ProcessButton, index: number) => (
        <ProcessMenuItem
          key={`${button.id}-${index}`}
          button={button}
          onProcessClick={onProcessClick}
          disabled={!selectedRecord}
        />
      ))}
    </Menu>
  );
};

export default ProcessMenu;
