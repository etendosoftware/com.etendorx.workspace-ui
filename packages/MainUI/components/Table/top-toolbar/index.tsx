import { FilterAlt, FilterAltOff } from '@mui/icons-material';
import useStyle from './styles';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useTranslation } from '@/hooks/useTranslation';

export default function TopToolbar({
  filterActive,
  toggleFilter,
  selectedCount = 0,
  onClearSelection,
}: {
  filterActive: boolean;
  toggleFilter: () => void;
  selectedCount?: number;
  onClearSelection?: () => void;
}) {
  const styles = useStyle();
  const { t } = useTranslation();
  const Icon = filterActive ? FilterAlt : FilterAltOff;
  const label = t(filterActive ? 'table.tooltips.implicitFilterOn' : 'table.tooltips.implicitFilterOff');

  return (
    <Box sx={styles.container}>
      <Box>
        {selectedCount > 0 && onClearSelection && (
          <Stack direction="row" spacing={1} alignItems="center" pl={1}>
            <Chip
              label={`${selectedCount} ${selectedCount === 1 ? 'elemento' : 'elementos'} seleccionados`}
              color="primary"
            />
            <Button size="small" onClick={onClearSelection} variant="outlined">
              Limpiar selección
            </Button>
          </Stack>
        )}
      </Box>
      <Box sx={styles.container}>
        <Typography aria-label={label}>{label}</Typography>
        <Icon sx={styles.icon} onClick={toggleFilter} />
      </Box>
    </Box>
  );
}
