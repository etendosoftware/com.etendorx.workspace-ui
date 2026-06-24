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
import { useFieldValue } from "@/hooks/useFieldValue";
import { useTranslation } from "@/hooks/useTranslation";
import Tag from "@workspaceui/componentlibrary/src/components/Tag";
import { isColorString, getContrastTextColor } from "@/utils/color/utils";
import { statusConfig } from "@/utils/columnsConstants";

const resolveTagColors = (color?: string) => {
  if (!color) return { tagColor: undefined, textColor: undefined };
  const normalized = color.trim().toLowerCase();
  if (!isColorString(normalized)) return { tagColor: undefined, textColor: undefined };
  return { tagColor: normalized, textColor: getContrastTextColor(normalized) };
};

export default function StatusBarField({ field }: { field: Field }) {
  const { register } = useFormContext();
  const { displayValue, colorValue, value } = useFieldValue(field);
  const { t } = useTranslation();

  const formatDisplayValue = (v: string) => {
    if (v === "Y") return t("common.trueText");
    if (v === "N") return t("common.falseText");

    if (field.refList && Array.isArray(field.refList)) {
      const refItem = field.refList.find((item) => item.value === v);
      if (refItem) {
        return refItem.label;
      }
    }

    return v;
  };

  const formattedValue = formatDisplayValue(displayValue);

  // Use the raw stored code (value) for refList/statusConfig lookups.
  // displayValue is the human-readable identifier ("Completed"), not the code ("CO").
  const rawCode = typeof value === "string" ? value : "";
  const refItem =
    field.refList && Array.isArray(field.refList) ? field.refList.find((item) => item.value === rawCode) : undefined;
  const effectiveColor = colorValue || refItem?.color;
  const { tagColor, textColor } = resolveTagColors(effectiveColor);

  const statusIcon = rawCode ? statusConfig[rawCode]?.icon : undefined;

  let badge: React.ReactNode;
  if (tagColor) {
    badge = (
      <Tag
        label={formattedValue}
        icon={statusIcon}
        tagColor={tagColor}
        textColor={textColor}
        data-testid={`StatusBarTag__${field.hqlName}`}
      />
    );
  } else if (refItem) {
    badge = <Tag label={formattedValue} icon={statusIcon} data-testid={`StatusBarTag__${field.hqlName}`} />;
  } else {
    badge = (
      <span className="" {...register(field.hqlName)}>
        {formattedValue}
      </span>
    );
  }

  return (
    <div className="inline-flex gap-1 items-center whitespace-nowrap">
      <label htmlFor={field.hqlName} className="font-semibold">
        {field.name}:
      </label>
      {badge}
    </div>
  );
}
