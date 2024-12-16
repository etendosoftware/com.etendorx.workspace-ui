import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Grid, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { SalesOrderFormType } from './types';
import DateSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/DateSelector';
import BooleanSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/BooleanSelector';
import { StringSelector } from '@workspaceui/componentlibrary/src/components/FormView/selectors/StringSelector';

const currencyOptions = [
  { id: 'USD', label: 'USD', value: 'USD' },
  { id: 'EUR', label: 'EUR', value: 'EUR' },
];

const warehouseOptions = [
  { id: 'WH1', label: 'Warehouse 1', value: 'WH1' },
  { id: 'WH2', label: 'Warehouse 2', value: 'WH2' },
];

function SalesOrderReportForm() {
  const {
    formState: { errors },
  } = useFormContext<SalesOrderFormType>();

  return (
    <Grid container spacing={2}>
      <Grid item xs={6} md={3}>
        <DateSelector name="dateFrom" value={'9-9-09'} onChange={() => {}} />
      </Grid>
      <Grid item xs={6} md={3}>
        <DateSelector name="dateTo" value={'10-10-10'} onChange={() => {}} />
      </Grid>
      <Grid item xs={6} md={3}>
        <Box>
          <BooleanSelector name="includeSubtotals" label="Include Subtotals" checked={false} onChange={() => {}} />
        </Box>
      </Grid>
      <Grid item xs={6} md={3}>
        <FormControl fullWidth>
          <InputLabel>Currency</InputLabel>
          <Select value="" label="Currency" onChange={() => {}}>
            {currencyOptions.map(option => (
              <MenuItem key={option.id} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Warehouse</InputLabel>
          <Select value="" label="Warehouse" onChange={() => {}}>
            {warehouseOptions.map(option => (
              <MenuItem key={option.id} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <Box>
          <label>Notes</label>
          <StringSelector value={''} setValue={() => {}} placeholder="Additional notes..." />
        </Box>
      </Grid>
    </Grid>
  );
}

export default memo(SalesOrderReportForm);
