import { useState } from 'react';
import { API_BASE_URL } from '../api/constants';

interface BaseReportParams {
  format: string;
}

export function useReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateReport = async <T extends BaseReportParams>(format: string, data: T) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new URLSearchParams();
      formData.append('Command', format === 'html' ? 'EDIT_HTML' : 'EDIT_PDF');

      const fieldMapping: Record<string, string> = {
        dateFrom: 'inpDateFrom',
        dateTo: 'inpDateTo',
        currencyId: 'inpCurrencyId',
        projectId: 'inpcProjectId',
        warehouseId: 'inpmWarehouseId',
        regionId: 'inpcRegionId',
      };

      Object.entries(data).forEach(([key, value]) => {
        if (value) {
          const fieldName = fieldMapping[key] || key;
          formData.append(fieldName, value.toString());
        }
      });

      const response = await fetch(`${API_BASE_URL}/ad_reports/ReportSalesOrderFilterJR.html`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const html = await response.text();
      const newWindow = window.open('', '_blank', 'width=700,height=700');
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  return { generateReport, loading, error };
}
