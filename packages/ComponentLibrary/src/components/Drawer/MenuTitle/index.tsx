import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { styles } from '../styles';
import {
  MenuType,
  MenuOption,
} from '../../../../../EtendoHookBinder/src/api/types';

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
        <Typography sx={styles.listItemText}>{item.label}</Typography>
      </Box>
      {item.type === MenuType.Summary ? (
        expanded ? (
          <ExpandLess />
        ) : (
          <ExpandMore />
        )
      ) : null}
    </Box>
  );
}
