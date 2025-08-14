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

import type { RadioButtonItemProps } from "./types";

const RadioButtonItem: React.FC<RadioButtonItemProps> = ({ id, title, description, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      className={`w-34 rounded-xl flex flex-col gap-2 p-2 mb-2 cursor-pointer ${
        isSelected ? "bg-opacity-5" : "bg-transparent"
      }`}
      style={{
        border: isSelected ? "1px solid var(--color-etendo-main)" : "1px solid var(--color-transparent-neutral-10)",
        backgroundColor: isSelected ? "var(--color-transparent-neutral-5)" : "transparent",
      }}
      onClick={() => onSelect(id)}>
      <div className="flex items-start">
        <div
          className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mr-2 ${
            isSelected ? "border-blue-600" : "border-gray-400"
          }`}
          style={{
            borderColor: isSelected ? "var(--color-etendo-main)" : "var(--color-baseline-70)",
          }}>
          {isSelected && (
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--color-etendo-main)" }} />
          )}
        </div>
        <div className="w-full">
          <h4 className="font-bold mb-1 text-sm leading-tight" style={{ color: "var(--color-baseline-100)" }}>
            {title}
          </h4>
          <p className="text-xs leading-tight break-words" style={{ color: "var(--color-baseline-80)" }}>
            {description}
          </p>
        </div>
      </div>
    </button>
  );
};

export default RadioButtonItem;
