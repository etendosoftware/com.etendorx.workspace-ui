import { memo } from 'react';
import { useForm, FormProvider, FieldValues } from 'react-hook-form';
import { Box, Paper, Button, Grid, Typography } from '@mui/material';
import DynamicField from './DynamicField';
import { ReportMetadata, ReportField } from '@workspaceui/etendohookbinder/src/hooks/types';

interface DynamicReportProps<T> {
  metadata: ReportMetadata;
  onSubmit: (format: string, data: T) => Promise<void>;
}

function DynamicReport<T extends FieldValues>({ metadata, onSubmit }: DynamicReportProps<T>) {
  const methods = useForm<T>();

  const handleSubmit = async (format: string) => {
    const isValid = await methods.trigger();
    if (isValid) {
      const data = methods.getValues();
      await onSubmit(format, data);
    }
  };

  return (
    <FormProvider {...methods}>
      <Paper sx={{ p: 2 }}>
        {metadata.sections.map(section => (
          <Box key={section.id} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {section.title}
            </Typography>
            <Grid container spacing={2}>
              {section.fields.map((field: ReportField) => (
                <Grid item xs={8} md={4} key={field.id}>
                  <DynamicField field={field} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {metadata.actions.map(action => (
            <Button key={action.id} variant="contained" onClick={() => handleSubmit(action.format)}>
              {action.name}
            </Button>
          ))}
        </Box>
      </Paper>
    </FormProvider>
  );
}

export default memo(DynamicReport);
