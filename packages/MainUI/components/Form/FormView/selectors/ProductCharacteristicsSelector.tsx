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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Field } from "@workspaceui/api-client/src/api/types";
import { useWatch } from "react-hook-form";
import { getCharacteristicLines, getCharacteristicsKey } from "@/utils/form/productCharacteristics";
import { StringSelector } from "./StringSelector";

/**
 * Read-only Product Characteristics field. As the Classic `OBCharacteristicsItem`, it shows one line per
 * characteristic of the product (with the parents set by `ShowProductCharacteristicsParents`). When the
 * form has no characteristics (a new record, or a product without them) it shows the stored text.
 */
export const ProductCharacteristicsSelector = ({ field }: { field: Field }) => {
  const characteristics = useWatch({ name: getCharacteristicsKey(field.hqlName) });
  const lines = getCharacteristicLines(characteristics);

  if (lines.length === 0) {
    return <StringSelector field={field} readOnly={true} data-testid={`StringSelector__prodchar__${field.id}`} />;
  }

  return (
    <dl
      className="flex w-full flex-col gap-1 py-1 text-sm leading-5"
      data-testid={`ProductCharacteristics__${field.id}`}>
      {lines.map((line) => (
        <div key={line.name} className="flex min-w-0 gap-2">
          <dt className="shrink-0 font-semibold text-baseline-80">{line.name}</dt>
          <dd className="truncate text-baseline-90" title={line.value}>
            {line.value}
          </dd>
        </div>
      ))}
    </dl>
  );
};
