import { useCallback, useMemo, useState } from 'react';
import { Collapse } from '@mui/material';
import { styles } from '../styles';
import MenuTitle from '../MenuTitle';
import { theme } from '../../../theme';
import { DrawerSectionProps } from '../types';
import { useParams } from 'react-router-dom';

export default function DrawerSection({
  item,
  onClick,
  open,
}: DrawerSectionProps) {
  const isMainSection = !!item.children?.length;
  const { id } = useParams();
  const isSelected = Boolean(id?.length && item.window?.id === id);
  const [expanded, setExpanded] = useState(false);

  const handleClick = useCallback(() => {
    if (item.children?.length) {
      setExpanded(prev => !prev);
    } else if (item.windowId) {
      onClick(`/window/${item.windowId}`);
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
    <div style={mainStyle}>
      <MenuTitle
        item={item}
        onClick={handleClick}
        selected={isSelected}
        expanded={expanded}
        open={open}
      />
      {item.children && open ? (
        <Collapse in={expanded} timeout="auto">
          {item.children.map(subitem => (
            <DrawerSection
              key={subitem.id}
              item={subitem}
              onClick={onClick}
              open={open}
            />
          ))}
        </Collapse>
      ) : null}
    </div>
  );
}
