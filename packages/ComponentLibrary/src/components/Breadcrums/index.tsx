import { FC, useState, useCallback, useRef } from 'react';
import {
  Breadcrumbs,
  Link,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import NavigateNextIcon from '../../assets/icons/chevron-right.svg';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import ChevronDown from '../../assets/icons/chevron-down.svg';
import MoreHorizIcon from '../../assets/icons/more-horizontal.svg';
import { theme } from '../../theme';
import { menuStyle, sx } from './styles';
import { BreadcrumbProps, BreadcrumbAction, BreadcrumbItem } from './types';
import ToggleChip from '../Toggle/ToggleChip';

const Breadcrumb: FC<BreadcrumbProps> = ({
  items,
  onHomeClick,
  homeIcon = null,
  homeText = 'Home',
  separator = (
    <NavigateNextIcon
      fill={theme.palette.baselineColor.transparentNeutral[30]}
    />
  ),
}) => {
  const [isHomeHovered, setIsHomeHovered] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [middleMenuAnchorEl, setMiddleMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [currentActions, setCurrentActions] = useState<BreadcrumbAction[]>([]);
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});
  const actionButtonRef = useRef<HTMLButtonElement>(null);

  const handleActionMenuOpen = useCallback((actions: BreadcrumbAction[]) => {
    if (actionButtonRef.current) {
      setAnchorEl(actionButtonRef.current);
      setCurrentActions(actions);
    }
  }, []);

  const handleActionMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleMiddleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMiddleMenuAnchorEl(event.currentTarget);
  };

  const handleMiddleMenuClose = () => {
    setMiddleMenuAnchorEl(null);
  };

  const handleToggle = useCallback((actionId: string) => {
    setToggleStates(prevStates => ({
      ...prevStates,
      [actionId]: !prevStates[actionId],
    }));
  }, []);

  const renderHomeIcon = useCallback(() => {
    if (isHomeHovered) {
      return (
        <IconButton sx={sx.homeIconHovered}>
          <ArrowLeftIcon fill={theme.palette.baselineColor.neutral[80]} />
        </IconButton>
      );
    } else if (homeIcon) {
      if (typeof homeIcon === 'string') {
        return <Box sx={sx.homeIconString}>{homeIcon}</Box>;
      } else {
        return <IconButton sx={sx.homeIconComponent}>{homeIcon}</IconButton>;
      }
    }
    return null;
  }, [homeIcon, isHomeHovered]);

  const renderBreadcrumbItems = () => {
    if (items.length <= 2) {
      return items.map((item, index) =>
        renderBreadcrumbItem(item, index === items.length - 1),
      );
    } else {
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const middleItems = items.slice(1, -1);

      return (
        <>
          {renderBreadcrumbItem(firstItem, false)}
          {middleItems.length > 0 && (
            <Box sx={sx.breadcrumbItem}>
              <IconButton onClick={handleMiddleMenuOpen} size="small">
                <MoreHorizIcon fill={theme.palette.baselineColor.neutral[80]} />
              </IconButton>
              <Menu
                anchorEl={middleMenuAnchorEl}
                open={Boolean(middleMenuAnchorEl)}
                onClose={handleMiddleMenuClose}
                slotProps={{
                  paper: { sx: sx.menu, elevation: 3 },
                }}
                MenuListProps={{ sx: menuStyle }}>
                {middleItems.map(item => (
                  <MenuItem
                    key={item.id}
                    onClick={() => {
                      item.onClick && item.onClick();
                      handleMiddleMenuClose();
                    }}
                    sx={sx.menuItem}>
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}
          {renderBreadcrumbItem(lastItem, true)}
        </>
      );
    }
  };
  const renderBreadcrumbItem = (item: BreadcrumbItem, isLast: boolean) => (
    <Box key={item.id} sx={sx.breadcrumbItem}>
      {isLast ? (
        <>
          <Typography
            noWrap
            sx={sx.lastItemTypography}
            onClick={() => {
              if (item.actions && item.actions.length > 0) {
                handleActionMenuOpen(item.actions);
              }
            }}>
            {item.label}
          </Typography>
          {item.actions && item.actions.length > 0 && (
            <IconButton
              size="small"
              ref={actionButtonRef}
              onClick={() => handleActionMenuOpen(item.actions!)}
              sx={sx.actionButton}>
              <ChevronDown fill={theme.palette.baselineColor.neutral[80]} />
            </IconButton>
          )}
        </>
      ) : (
        <Link
          href="#"
          onClick={e => {
            e.preventDefault();
            item.onClick && item.onClick();
          }}
          sx={sx.link}>
          <Typography noWrap sx={sx.breadcrumbTypography}>
            {item.label}
          </Typography>
        </Link>
      )}
    </Box>
  );

  return (
    <Box sx={sx.container}>
      <Breadcrumbs
        separator={separator}
        aria-label="breadcrumb"
        sx={sx.breadcrumbs}>
        <Box sx={sx.homeContainer}>
          <Link
            href="#"
            onClick={e => {
              e.preventDefault();
              onHomeClick();
            }}
            onMouseEnter={() => setIsHomeHovered(true)}
            onMouseLeave={() => setIsHomeHovered(false)}
            sx={sx.homeLink}>
            {renderHomeIcon()}
          </Link>
          <Typography onClick={onHomeClick} sx={sx.homeText}>
            {homeText}
          </Typography>
        </Box>
        {renderBreadcrumbItems()}
      </Breadcrumbs>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionMenuClose}
        slotProps={{
          paper: { sx: sx.menu, elevation: 3 },
        }}
        MenuListProps={{ sx: menuStyle }}>
        {currentActions.map(action => (
          <MenuItem key={action.id} onClick={() => {}} sx={sx.menuItem}>
            <Box sx={sx.iconBox}>
              {action.icon}
              <span>{action.label}</span>
            </Box>
            {action.toggle && (
              <Box sx={sx.toggleContainer}>
                <ToggleChip
                  isActive={toggleStates[action.id] ?? false}
                  onToggle={() => handleToggle(action.id)}
                />
              </Box>
            )}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default Breadcrumb;
