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

import type { Field } from "@workspaceui/api-client/src/api/types";
import { useFormContext } from "react-hook-form";

function formatDateForInput(value: string): string {
  if (!value) return "";

  const match = value.match(/^(\d{2})T(\d{2}:\d{2}:\d{2}(?:\.\d*)?)Z-(\d{2})-(\d{4})$/);

  const normalized = match ? `${match[4]}-${match[3]}-${match[1]}T${match[2]}Z` : value;

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 16);
}

export const DatetimeSelector = ({ field, isReadOnly }: { field: Field; isReadOnly?: boolean }) => {
  const { register, getValues } = useFormContext();
  const value = getValues(field.hqlName);

  return (
    <input type="datetime-local" {...register(field.hqlName)} readOnly={isReadOnly} value={formatDateForInput(value)} />
  );
};

export default DatetimeSelector;
