import { FilterAlt, FilterAltOff } from '@mui/icons-material';
import useStyle from './styles';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useTranslation } from '@/hooks/useTranslation';
import { useCallback, useMemo } from 'react';
import { MRT_TableInstance } from 'material-react-table';
import { EntityData } from '@workspaceui/etendohookbinder/src/api/types';

export default function TopToolbar({
  filterActive,
  toggleFilter,
  table,
}: {
  filterActive: boolean;
  toggleFilter: () => void;
  table: MRT_TableInstance<EntityData>;
}) {
  const styles = useStyle();
  const { t } = useTranslation();
  const label = t(filterActive ? 'table.tooltips.implicitFilterOn' : 'table.tooltips.implicitFilterOff');
  const rowSelection = table.getState().rowSelection;
  const selectedCount = useMemo(() => Object.keys(rowSelection).length, [rowSelection]);
  const selectionLabel = t(selectedCount === 1 ? 'table.selection.single' : 'table.selection.multiple');
  const handleClearSelection = useCallback(() => table.setRowSelection({}), [table]);

  return (
    <div className="flex justify-between items-center border-b border-b-transparent-neutral-10">
      <div>
        {selectedCount > 0 && (
          <Stack direction="row" spacing={1} alignItems="center" pl={1}>
            <Chip label={`${selectedCount} ${selectionLabel}`} color="primary" />
            <Button size="small" onClick={handleClearSelection} variant="outlined">
              {t('common.clear')}
            </Button>
          </Stack>
        )}
      </div>
      <Box sx={styles.container} onClick={toggleFilter} className="cursor-pointer">
        <Typography aria-label={label}>{label}</Typography>
        {filterActive ? <FilterAlt sx={styles.icon} /> : <FilterAltOff sx={styles.icon} />}
      </Box>
    </div>
  );
}
