import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { styles } from '../styles';
import { Menu } from '../../../../../EtendoHookBinder/src/api/types';
import { Tooltip } from '@mui/material';

export default function MenuTitle({
  item,
  onClick,
  selected,
  expanded,
  open,
}: {
  item: Menu;
  onClick: () => void;
  selected?: boolean;
  expanded?: boolean;
  open?: boolean;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        ...styles.listItemButton,
        ...styles.listItemContentText,
        ...(selected ? styles.listItemButtonSelected : undefined),
        ...(open ? undefined : styles.asd),
      }}>
      <div style={styles.listItemInnerContentText}>
        <Typography sx={styles.listItemText}>
          {item.icon ? <span>{item.icon}</span> : null}
          {open && (
            <Tooltip title={item.name} arrow>
              <span>{item.name}</span>
            </Tooltip>
          )}
        </Typography>
      </div>
      {open && item.children && (expanded ? <ExpandLess /> : <ExpandMore />)}
    </Box>
  );
}
