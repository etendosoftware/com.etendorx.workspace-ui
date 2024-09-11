import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { styles } from '../styles';
import { MenuOption } from '../../../../../EtendoHookBinder/src/api/types';

export default function MenuTitle({
  item,
  onClick,
  selected,
  expanded,
}: {
  item: MenuOption;
  onClick: () => void;
  selected?: boolean;
  expanded?: boolean;
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
          {item.eTMETAIcon ? <span>{item.eTMETAIcon}</span> : null}
          <span>{item.name}</span>
        </Typography>
      </Box>
      {item.children ? expanded ? <ExpandLess /> : <ExpandMore /> : null}
    </Box>
  );
}
