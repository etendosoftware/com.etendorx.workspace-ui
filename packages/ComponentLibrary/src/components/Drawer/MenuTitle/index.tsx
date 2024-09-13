import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { styles } from '../styles';
import { Menu } from '../../../../../EtendoHookBinder/src/api/types';

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
      }}>
      <Box sx={styles.listItemInnerContentText}>
        <Typography sx={styles.listItemText}>
          {item.icon ? <span>{item.icon}</span> : null}
          <span>{item.name}</span>
        </Typography>
      </Box>
      {item.children ? expanded ? <ExpandLess /> : <ExpandMore /> : null}
    </Box>
  );
}
