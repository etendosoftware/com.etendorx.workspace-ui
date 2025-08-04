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

import { logger } from "@/utils/logger";
import type { ReportField, ReportMetadata } from "@workspaceui/api-client/src/hooks/types";
import { useState } from "react";

type ReportFields = {
  [K in ReportField["name"]]: unknown;
};

interface BaseReportParams extends ReportFields {
  format: string;
  reportId: string;
  metadata: ReportMetadata;
}

const processFields = (formData: URLSearchParams, data: BaseReportParams) => {
  const { metadata } = data;

  for (const section of metadata.sections) {
    for (const field of section.fields) {
      const value = data[field.name];

      if (field.type === "multiselect" && Array.isArray(value)) {
        for (const val of value) {
          if (val) {
            formData.append(field.name, val);
          }
          return;
        }
      }

      if (value !== undefined && value !== null) {
        formData.append(field.name, value.toString());
      }
    }
  }
};

const setupFormData = (data: BaseReportParams, format: string): URLSearchParams => {
  const formData = new URLSearchParams();
  const action = data.metadata.actions.find((a) => a.format === format);

  formData.append("Command", action?.command || "EDIT_HTML");
  formData.append("format", format);
  formData.append("reportId", data.reportId);

  processFields(formData, data);

  return formData;
};

const openReportWindow = (html: string) => {
  const newWindow = window.open("", "_blank", "width=700,height=700");
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  }
};

export function useReport(url: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateReport = async <T extends BaseReportParams>(format: string, data: T) => {
    setLoading(true);
    setError(null);

    try {
      const formData = setupFormData(data, format);

      const response = await fetch(`${url}/ad_reports/${data.metadata.sourcePath}.html`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const html = await response.text();
      openReportWindow(html);
    } catch (err) {
      logger.warn(err);

      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return { generateReport, loading, error };
}
