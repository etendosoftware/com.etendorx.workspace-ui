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

import { useMemo } from "react";
import type { WidgetParam } from "@workspaceui/api-client/src/api/dashboard";
import { useTranslation } from "@/hooks/useTranslation";
import { isSafeUrl, isUrlParam } from "@/utils/urlSafety";

interface WidgetParamFieldsProps {
  params: WidgetParam[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  testIdPrefix: string;
}

export function useUrlErrors(params: WidgetParam[], values: Record<string, string>) {
  const urlErrors = useMemo<Record<string, boolean>>(() => {
    const errors: Record<string, boolean> = {};
    for (const p of params) {
      const val = values[p.name] ?? "";
      if (p.type === "TEXT" && isUrlParam(p) && val !== "" && !isSafeUrl(val)) {
        errors[p.name] = true;
      }
    }
    return errors;
  }, [params, values]);

  const hasUrlErrors = Object.keys(urlErrors).length > 0;
  return { urlErrors, hasUrlErrors };
}

export default function WidgetParamFields({ params, values, onChange, testIdPrefix }: WidgetParamFieldsProps) {
  const { t } = useTranslation();
  const { urlErrors } = useUrlErrors(params, values);

  const updateParam = (name: string, value: string) => {
    onChange({ ...values, [name]: value });
  };

  return (
    <>
      {params.map((param) => (
        <div key={param.name} className="flex flex-col gap-1.5">
          <label htmlFor={`${testIdPrefix}-${param.name}`} className="text-sm font-medium text-baseline-100">
            {param.displayName}
            {param.required && <span className="text-error-main ml-0.5">*</span>}
          </label>
          {(() => {
            if (param.type === "BOOLEAN") {
              return (
                <input
                  id={`${testIdPrefix}-${param.name}`}
                  type="checkbox"
                  checked={values[param.name] === "true"}
                  onChange={(e) => updateParam(param.name, e.target.checked ? "true" : "false")}
                  className="w-4 h-4 cursor-pointer"
                  data-testid={`${testIdPrefix}__param_${param.name}`}
                />
              );
            }
            if (param.type === "LIST" && param.listValues) {
              return (
                <select
                  id={`${testIdPrefix}-${param.name}`}
                  value={values[param.name] ?? ""}
                  onChange={(e) => updateParam(param.name, e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-transparent-neutral-5 border border-transparent-neutral-10 text-baseline-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  data-testid={`${testIdPrefix}__param_${param.name}`}>
                  {param.listValues.map((lv) => (
                    <option key={lv.value} value={lv.value}>
                      {lv.label}
                    </option>
                  ))}
                </select>
              );
            }
            return (
              <input
                id={`${testIdPrefix}-${param.name}`}
                type={param.type === "NUMBER" ? "number" : "text"}
                value={values[param.name] ?? ""}
                onChange={(e) => updateParam(param.name, e.target.value)}
                className={[
                  "w-full px-3 py-2 text-sm rounded-lg bg-transparent-neutral-5 border text-baseline-100 placeholder:text-baseline-50 focus:outline-none focus:ring-2 transition-colors",
                  urlErrors[param.name]
                    ? "border-error-main focus:ring-error-main/40"
                    : "border-transparent-neutral-10 focus:ring-blue-500/40",
                ].join(" ")}
                data-testid={`${testIdPrefix}__param_${param.name}`}
              />
            );
          })()}
          {urlErrors[param.name] && (
            <p className="text-xs text-error-main" data-testid={`${testIdPrefix}__param_error_${param.name}`}>
              {t("dashboard.params.urlError")}
            </p>
          )}
          {param.description && (
            <p
              className="text-xs text-baseline-50 leading-snug"
              data-testid={`${testIdPrefix}__param_hint_${param.name}`}>
              {param.description}
            </p>
          )}
        </div>
      ))}
    </>
  );
}
