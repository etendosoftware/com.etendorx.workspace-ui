import { memo, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Box, Paper, Button } from '@mui/material';
import type { SalesOrderFormType } from './types';
import SalesOrderReportForm from './SalesOrderReportForm';

function SalesOrderReport() {
  const methods = useForm<SalesOrderFormType>({
    defaultValues: {
      dateFrom: '',
      dateTo: '',
      currency: '',
      project: '',
      warehouse: '',
      businessPartners: [],
      products: [],
      productCategories: [],
      region: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const handleHTMLReport = useCallback(async (data: SalesOrderFormType) => {
    try {
      const response = await fetch('/api/reports/sales-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          format: 'html',
        }),
      });

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating report:', error);
    }
  }, []);

  return (
    <FormProvider {...methods}>
      <Box component={Paper} sx={{ p: 2 }}>
        <form onSubmit={methods.handleSubmit(handleHTMLReport)}>
          <SalesOrderReportForm />
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" type="submit">
              HTML Format
            </Button>
          </Box>
        </form>
      </Box>
    </FormProvider>
  );
}

export default memo(SalesOrderReport);
