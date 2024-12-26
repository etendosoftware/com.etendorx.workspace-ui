import { useState } from 'react';
import { API_BASE_URL } from '../api/constants';
import { ReportField, ReportMetadata } from './types';

type ReportFields = {
  [K in ReportField['name']]: unknown;
};

interface BaseReportParams extends ReportFields {
  format: string;
  reportId: string;
  metadata: ReportMetadata;
}

export function useReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateReport = async <T extends BaseReportParams>(format: string, data: T) => {
    setLoading(true);
    setError(null);

    try {
      const { metadata } = data;
      const formData = new URLSearchParams();

      const action = metadata.actions.find(a => a.format === format);
      formData.append('Command', action?.command || 'EDIT_HTML');

      metadata.sections.forEach(section => {
        section.fields.forEach(field => {
          const value = data[field.name];

          if (field.type === 'multiselect' && Array.isArray(value)) {
            value.forEach(val => {
              if (val) {
                formData.append(field.name, val);
              }
            });
          } else if (value !== undefined && value !== null) {
            formData.append(field.name, value.toString());
          }
        });
      });

      formData.append('format', format);
      formData.append('reportId', data.reportId);

      const response = await fetch(`${API_BASE_URL}/ad_reports/${metadata.sourcePath}.html`, {
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
