/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

"use client";

import { useCallback } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useParams } from "next/navigation";
import DynamicReport from "../../../../components/ad_reports/DynamicReport";
import type { FieldValues } from "react-hook-form";
import { useApiContext } from "@/hooks/useApiContext";
import { useReportMetadata } from "@/hooks/useReportMetadata";
import { useReport } from "@/hooks/useReport";

export default function ReportPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const { metadata, loading, error } = useReportMetadata(reportId);
  const apiUrl = useApiContext();
  const { generateReport } = useReport(apiUrl);

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
    [generateReport, metadata, reportId]
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
