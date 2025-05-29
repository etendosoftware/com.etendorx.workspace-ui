import { type FC, useState, useCallback, useMemo, useRef } from 'react';
import { Breadcrumbs, Link, Typography, Box, MenuItem, useTheme } from '@mui/material';
import NavigateNextIcon from '../../assets/icons/chevron-right.svg';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import ChevronDown from '../../assets/icons/chevron-down.svg';
import MoreHorizIcon from '../../assets/icons/more-horizontal.svg';
import { useStyle } from './styles';
import type { BreadcrumbProps, BreadcrumbAction, BreadcrumbItem } from './types';
import ToggleChip from '../Toggle/ToggleChip';
import IconButton from '../IconButton';
import Menu from '../Menu';

const Breadcrumb: FC<BreadcrumbProps> = ({ items, onHomeClick, homeIcon = null, homeText = 'Home', separator }) => {
  const [isHomeHovered, setIsHomeHovered] = useState<boolean>(false);
  const [isOpenMenu, setIsOpenMenu] = useState<boolean>(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [middleRect, setMiddleRect] = useState<DOMRect | null>(null);

  const [currentActions, setCurrentActions] = useState<BreadcrumbAction[]>([]);
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});
  const theme = useTheme();
  const { sx } = useStyle();

  const defaultSeparator = useMemo(
    () => <NavigateNextIcon fill={theme.palette.baselineColor.transparentNeutral[30]} />,
    [theme],
  );

  const handleMouseEnter = useCallback(() => setIsHomeHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHomeHovered(false), []);

  const handleActionMenuOpen = useCallback((actions: BreadcrumbAction[]) => {
    setCurrentActions(actions);
    setIsOpenMenu(true);
  }, []);

  const handleActionMenuClose = useCallback(() => {
    setIsOpenMenu(false);
  }, []);

  const handleMiddleMenuOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const newRect = event.currentTarget.getBoundingClientRect();
    setRect(newRect);
    setIsOpenMenu((prev) => !prev);
  }, []);

  const handleMiddleMenuClose = useCallback(() => {
    setMiddleRect(null);
  }, []);

  const handleClick = useCallback(
    (e: { preventDefault: () => void }) => {
      e.preventDefault();
      onHomeClick();
    },
    [onHomeClick],
  );

  const handleToggle = useCallback((actionId: string) => {
    setToggleStates((prevStates) => ({
      ...prevStates,
      [actionId]: !prevStates[actionId],
    }));
  }, []);

  const renderHomeIcon = useCallback(() => {
    if (isHomeHovered) {
      return (
        <IconButton className="w-10 h-10 bg-(--color-baseline-0) hover:bg-(--color-baseline-0) hover:text-(--color-baseline-80)">
          <ArrowLeftIcon />
        </IconButton>
      );
    }
    return <IconButton className="w-10 h-10 text-[1.5rem] bg-(--color-transparent-neutral-5)">{homeIcon}</IconButton>;
  }, [homeIcon, isHomeHovered]);

  const renderBreadcrumbItem = useCallback(
    (item: BreadcrumbItem, isLast: boolean) => (
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
              <IconButton onClick={() => handleActionMenuOpen(item.actions!)}>
                <ChevronDown fill={theme.palette.baselineColor.neutral[80]} />
              </IconButton>
            )}
          </>
        ) : (
          <Link
            href="#"
            onClick={(e) => {
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
    ),
    [
      handleActionMenuOpen,
      sx.breadcrumbItem,
      sx.breadcrumbTypography,
      sx.lastItemTypography,
      sx.link,
      theme.palette.baselineColor.neutral,
    ],
  );

  const renderBreadcrumbItems = useMemo(() => {
    if (items.length <= 2) {
      return items.map((item, index) => renderBreadcrumbItem(item, index === items.length - 1));
    } else {
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const middleItems = items.slice(1, -1);

      return (
        <>
          {renderBreadcrumbItem(firstItem, false)}
          {middleItems.length > 0 && (
            <Box sx={sx.breadcrumbItem}>
              <IconButton onClick={handleMiddleMenuOpen}>
                <MoreHorizIcon fill={theme.palette.baselineColor.neutral[80]} />
              </IconButton>
              <Menu rect={middleRect} open={isOpenMenu} onClose={handleMiddleMenuClose}>
                {middleItems.map((item) => (
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
  }, [
    handleMiddleMenuClose,
    handleMiddleMenuOpen,
    isOpenMenu,
    items,
    middleRect,
    renderBreadcrumbItem,
    sx.breadcrumbItem,
    sx.menuItem,
    theme.palette.baselineColor.neutral,
  ]);

  const activeSeparator = separator ?? defaultSeparator;

  return (
    <Box sx={sx.container}>
      <Breadcrumbs separator={activeSeparator} aria-label="breadcrumb" sx={sx.breadcrumbs}>
        <Box sx={sx.homeContainer}>
          <Link href="#" onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {renderHomeIcon()}
          </Link>
          <Typography onClick={onHomeClick} sx={sx.homeText}>
            {homeText}
          </Typography>
        </Box>
        {renderBreadcrumbItems}
      </Breadcrumbs>
      <Menu rect={rect} open={isOpenMenu} onClose={handleActionMenuClose}>
        {currentActions.map((action) => (
          <MenuItem key={action.id} onClick={() => {}} sx={sx.menuItem}>
            <Box sx={sx.iconBox}>
              {action.icon}
              <span>{action.label}</span>
            </Box>
            {action.toggle && (
              <Box sx={sx.toggleContainer}>
                <ToggleChip isActive={toggleStates[action.id] ?? false} onToggle={() => handleToggle(action.id)} />
              </Box>
            )}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default Breadcrumb;
