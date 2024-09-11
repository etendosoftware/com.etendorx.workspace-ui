import { useCallback, useMemo, useState } from 'react';
import { Collapse, Box } from '@mui/material';
import { styles } from '../styles';
import MenuTitle from '../MenuTitle';
import { theme } from '../../../theme';
import { DrawerSectionProps } from '../types';

const ActualDrawerSection = ({ item, onClick }: DrawerSectionProps) => {
  const isMainSection = !!item.children?.length;
  const isSelected = false;
  const [expanded, setExpanded] = useState(false);

  const handleClick = useCallback(() => {
    if (item.children?.length) {
      setExpanded(prev => !prev);
    } else if (item.window?.id) {
      onClick(`/window/${item.window.id}`);
    } else {
      console.error('DrawerSection: unexpected type');
    }
  }, [item, onClick]);

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
      {item.children ? (
        <Collapse in={expanded} timeout="auto">
          <Box sx={styles.contentBox}>
            {item.children.map(subitem => (
              <DrawerSection
                key={subitem.id}
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

const DrawerSection = (props: DrawerSectionProps) => {
  if (props.item) {
    return <ActualDrawerSection {...props} />;
  }

  return null;
};

export default DrawerSection;
