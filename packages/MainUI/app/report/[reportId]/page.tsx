'use client';

import { useCallback } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useParams } from 'next/navigation';
import DynamicReport from '../../../components/ad_reports/DynamicReport';
import { useReport } from '@workspaceui/etendohookbinder/src/hooks/useReport';
import { useReportMetadata } from '@workspaceui/etendohookbinder/src/hooks/useReportMetadata';
import { FieldValues } from 'react-hook-form';

export default function ReportPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const { metadata, loading, error } = useReportMetadata(reportId);
  const { generateReport } = useReport();

  const handleSubmit = useCallback(
    async (format: string, data: FieldValues) => {
      if (!metadata) return;

      const reportData = {
        ...data,
        format,
        reportId,
        metadata,
      };
      await generateReport(format, reportData);
    },
    [generateReport, metadata, reportId],
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" m={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !metadata) {
    return <Box m={2}>Report not found</Box>;
  }

  return (
    <Box m={2}>
      <DynamicReport metadata={metadata} onSubmit={handleSubmit} />
    </Box>
  );
}
