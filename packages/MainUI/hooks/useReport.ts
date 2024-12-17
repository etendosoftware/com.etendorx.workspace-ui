import { useState } from 'react';
import type { BaseReportParams } from '../reports/types';

interface UseReportOptions {
  endpoint: string;
}

export function useReport({ endpoint }: UseReportOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateReport = async <T extends BaseReportParams>(format: string, data: Omit<T, 'format'>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  return { generateReport, loading, error };
}
