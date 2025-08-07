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

import type React from "react";

export interface RadioGridOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface RadioGridProps {
  options: RadioGridOption[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  disabled?: boolean;
  name?: string;
}

const RadioGrid: React.FC<RadioGridProps> = ({
  options,
  selectedValue,
  onSelect,
  className = "",
  columns = 3,
  disabled = false,
  name = "radio-grid",
}) => {
  const getGridCols = () => {
    switch (columns) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
      default:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
    }
  };

  return (
    <div className={`grid ${getGridCols()} gap-4 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          className={`rounded-lg flex flex-col cursor-pointer min-w-0 text-left transition-colors ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : selectedValue === option.value
                ? "bg-(--color-transparent-neutral-5) border border-(--color-etendo-main) hover:bg-(--color-transparent-neutral-10)"
                : "bg-(--color-baseline-10) border border-(--color-baseline-30) hover:bg-(--color-transparent-neutral-5)"
          }`}
          onClick={() => !disabled && onSelect(option.value)}
          aria-label={`Seleccionar ${option.label}`}>
          <div className="flex items-start p-4">
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mr-3 ${
                selectedValue === option.value ? "border-(--color-etendo-main)" : "border-gray-400"
              }`}>
              {selectedValue === option.value && <div className="w-3 h-3 rounded-full bg-(--color-etendo-main)" />}
            </div>
            <div className="w-full">
              {option.icon && <div className="mb-2">{option.icon}</div>}
              <h4
                className={`font-bold text-base ${
                  selectedValue === option.value ? "text-(--color-etendo-main)" : "text-gray-800"
                }`}>
                {option.label}
              </h4>
              {option.description && <p className="text-xs text-gray-500 mt-1">{option.description}</p>}
            </div>
          </div>
        </button>
      ))}
      <input type="hidden" name={name} value={selectedValue || ""} readOnly />
    </div>
  );
};

export default RadioGrid;
