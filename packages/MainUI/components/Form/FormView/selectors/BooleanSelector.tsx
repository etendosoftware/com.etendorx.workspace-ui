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
import { useController, useFormContext } from "react-hook-form";
import { Switch } from "./components/Switch";

export const BooleanSelector = ({ field, isReadOnly }: { field: Field; isReadOnly: boolean }) => {
  const { control } = useFormContext();

  const {
    field: { value = false, onChange },
  } = useController({
    name: field.hqlName,
    control,
    defaultValue: false,
  });

  return (
    <Switch
      checked={!!value}
      onCheckedChange={onChange}
      field={field}
      disabled={isReadOnly}
      data-testid="Switch__756a1e"
    />
  );
};
