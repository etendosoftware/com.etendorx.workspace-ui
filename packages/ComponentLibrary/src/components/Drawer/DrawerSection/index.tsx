import { useCallback, useMemo, useState } from 'react';
import { Collapse, Box } from '@mui/material';
import { styles } from '../styles';
import MenuTitle from '../MenuTitle';
import { theme } from '../../../theme';
import { DrawerSectionProps } from '../types';
import { MenuType } from '../../../../../EtendoHookBinder/src/api/types';

const DrawerSection = ({ item, onClick }: DrawerSectionProps) => {
  const isMainSection = item.type === MenuType.Folder;
  const isSelected = false;
  const [expanded, setExpanded] = useState(false);

  const handleClick = useCallback(() => {
    if (item.type === MenuType.Folder) {
      setExpanded(prev => !prev);
    } else if (item.type === MenuType.Window) {
      onClick(`/window/${item.windowId}`);
    } else {
      console.error('DrawerSection: unexpected type');
    }
  }, [item.type, item.windowId, onClick]);

  const mainStyle = useMemo(
    () => ({
      ...styles.drawerSectionBox,
      backgroundColor:
        isMainSection && isSelected
          ? theme.palette.baselineColor.neutral[10]
          : 'transparent',
    }),
    [isMainSection, isSelected],
  );

  return (
    <Box sx={mainStyle}>
      <MenuTitle
        item={item}
        onClick={handleClick}
        selected={isSelected}
        expanded={expanded}
      />

      {item.type === MenuType.Folder && item.submenu ? (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={styles.contentBox}>
            {item.submenu.map(subitem => (
              <DrawerSection
                key={subitem.title}
                item={subitem}
                onClick={onClick}
              />
            ))}
          </Box>
        </Collapse>
      ) : null}
    </Box>
  );
};

export default DrawerSection;
