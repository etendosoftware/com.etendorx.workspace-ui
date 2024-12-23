import { useState, useEffect, useCallback } from 'react';
import { ReportMetadata } from './types';

export interface ReportMetadataHook {
  metadata: ReportMetadata | null;
  loading: boolean;
  error: string | null;
}

const REPORT_ID_TO_FILE_MAP: Record<string, string> = {
  '800261': 'sales-order',
  '800069': 'sales-order-invoice',
};

export const useReportMetadata = (reportId?: string): ReportMetadataHook => {
  const [metadata, setMetadata] = useState<ReportMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(
    async (controller: AbortController) => {
      if (!reportId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fileName = REPORT_ID_TO_FILE_MAP[reportId];
        if (!fileName) {
          throw new Error(`No report file found for ID: ${reportId}`);
        }

        const reportModule = await import(`../reports/${fileName}`);

        if (!controller.signal.aborted) {
          const reportMeta = Object.values(reportModule)[0] as ReportMetadata;
          if (reportMeta.id !== reportId) {
            throw new Error(`Report ID mismatch: expected ${reportId}, got ${reportMeta.id}`);
          }
          setMetadata(reportMeta);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError('Failed to load report metadata: ' + (err as Error).message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [reportId],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchMetadata(controller);
    return () => {
      controller.abort();
    };
  }, [fetchMetadata]);

  return { metadata, loading, error };
};
