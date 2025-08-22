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
// @data-testid-ignore
import { memo } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { TextField, Autocomplete } from "@mui/material";
import type { ReportField } from "@workspaceui/api-client/src/hooks/types";
import DateSelector from "./selectors/DateSelector";
import DatabaseSelectSelector from "./selectors/DatabaseSelect";
import MultiSelect from "./selectors/MultiSelect/MultiSelector";

interface DynamicFieldProps {
  field: ReportField;
}

function DynamicFieldComponent({ field }: DynamicFieldProps) {
  const { control, setValue } = useFormContext();

  switch (field.type) {
    case "date":
      return (
        <Controller
          name={field.name}
          control={control}
          rules={{ required: field.required }}
          render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
            <DateSelector
              label={field.label}
              name={field.name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              required={field.required}
              error={!!error}
              helperText={error?.message}
              data-testid={`DateSelector__${field.id ?? "6107b5"}`}
            />
          )}
          data-testid={`Controller__${field.id ?? "6107b5"}`}
        />
      );
    case "select":
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: { onChange, value } }) => (
            <DatabaseSelectSelector
              value={value || ""}
              name={field.name}
              title={field.label}
              onChange={onChange}
              readOnly={false}
              entity={field.entity || ""}
              data-testid={`DatabaseSelectSelector__${field.id ?? "6107b5"}`}
            />
          )}
          data-testid={`Controller__${field.id ?? "6107b5"}`}
        />
      );
    case "search":
      return (
        <Controller
          name={field.name}
          control={control}
          rules={{ required: field.required }}
          render={({ field: { onChange, value } }) => (
            <Autocomplete
              options={field.lookupConfig?.values || []}
              value={value || null}
              getOptionLabel={(option) => option?.name || ""}
              onChange={(_, newValue) => onChange(newValue)}
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  label={field.label}
                  required={field.required}
                  data-testid={`TextField__${field.id ?? "6107b5"}`}
                />
              )}
              data-testid={`Autocomplete__${field.id ?? "6107b5"}`}
            />
          )}
          data-testid={`Controller__${field.id ?? "6107b5"}`}
        />
      );
    case "multiselect":
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: { value } }) => (
            <MultiSelect
              value={value || []}
              onChange={(selectedIds) => {
                setValue(field.name, selectedIds, { shouldDirty: true });
              }}
              title={field.label}
              entity={field.entity || ""}
              columnName={field.columnName || ""}
              identifierField={field.identifierField || ""}
              columns={field.columns}
              data-testid={`MultiSelect__${field.id ?? "6107b5"}`}
            />
          )}
          data-testid={`Controller__${field.id ?? "6107b5"}`}
        />
      );
    default:
      return (
        <Controller
          name={field.name}
          control={control}
          rules={{ required: field.required }}
          render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
            <TextField
              fullWidth
              label={field.label}
              value={value || ""}
              onChange={onChange}
              onBlur={onBlur}
              required={field.required}
              error={!!error}
              helperText={error?.message}
              data-testid="TextField__6107b5"
            />
          )}
          data-testid="Controller__6107b5"
        />
      );
  }
}

export const DynamicField = memo(DynamicFieldComponent);

export default DynamicField;
