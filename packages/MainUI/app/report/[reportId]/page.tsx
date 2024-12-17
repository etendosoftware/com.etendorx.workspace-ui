'use client';

import { Box } from '@mui/material';
import { useParams } from 'next/navigation';
import DynamicReport from '../../../components/ad_reports/DynamicReport';
import { SALES_ORDER_REPORT_META } from '../../../reports/sales-order';
import { ReportMetadata } from '../../../reports/types';
import { useReport } from '@workspaceui/etendohookbinder/src/hooks/useReport';

type ReportMap = {
  [key: string]: ReportMetadata;
};

const REPORT_METADATA: ReportMap = {
  '800261': SALES_ORDER_REPORT_META,
};

export default function ReportPage() {
  const params = useParams();
  const reportId = params.reportId as string;

  const metadata = REPORT_METADATA[reportId];

  const { generateReport } = useReport();

  if (!metadata) {
    return <Box>Report not found</Box>;
  }

  return (
    <Box m={2}>
      <DynamicReport metadata={metadata} onSubmit={generateReport} />
    </Box>
  );
}
