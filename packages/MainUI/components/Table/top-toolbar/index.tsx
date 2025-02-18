import { FilterAlt, FilterAltOff } from '@mui/icons-material';
import useStyle from './styles';
import { Box } from '@mui/material';
import { useTranslation } from '@/hooks/useTranslation';

export default function TopToolbar({
  filterActive,
  toggleFilter,
}: {
  filterActive: boolean;
  toggleFilter: () => void;
}) {
  const styles = useStyle();
  const { t } = useTranslation();
  const Icon = filterActive ? FilterAlt : FilterAltOff;
  const label = t(filterActive ? 'table.tooltips.implicitFilterOn' : 'table.tooltips.implicitFilterOff');

  return (
    <Box sx={styles.container}>
      <Icon sx={styles.icon} onClick={toggleFilter} titleAccess={label} aria-label={label} />
    </Box>
  );
}
