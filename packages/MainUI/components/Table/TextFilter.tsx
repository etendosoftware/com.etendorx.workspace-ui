import type React from "react";
import { useState, useEffect } from "react";
import type { Column } from "@workspaceui/api-client/src/api/types";
import { isTextFilterValue } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { LegacyColumnFilterUtils } from "@workspaceui/api-client/src/utils/search-utils";
import type { TextFilterValue } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { useDebouncedCallback } from "./utils/performanceOptimizations";

/** Single toast id so repeated invalid values replace the message instead of stacking it. */
const INVALID_FILTER_TOAST_ID = "invalid-column-filter-value";

export interface TextFilterProps {
  column: Column;
  onFilterChange: (filterValue: string) => void;
  filterValue?: string | TextFilterValue;
}

export const TextFilter: React.FC<TextFilterProps> = ({ column, onFilterChange, filterValue }) => {
  const [inputValue, setInputValue] = useState("");

  const { t } = useTranslation();

  const debouncedFilterChange = useDebouncedCallback((value: string) => {
    // Classic numeric filters clear the input when the expression uses an unsupported operator
    if (LegacyColumnFilterUtils.hasUnsupportedNumericOperator(value, column)) {
      setInputValue("");
      onFilterChange("");
    } else if (LegacyColumnFilterUtils.hasInvalidNumericValue(value, column)) {
      // Classic rejects invalid numeric values with a message and keeps the current results
      toast.error(t("table.invalidFilterValue"), { id: INVALID_FILTER_TOAST_ID, description: value.trim() });
    } else {
      onFilterChange(value);
    }
  }, 500);

  useEffect(() => {
    setInputValue(isTextFilterValue(filterValue) ? filterValue.text : filterValue || "");
  }, [filterValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedFilterChange(value);
  };

  return (
    <div className="w-full flex items-center py-2 h-10 border-b border-baseline-10 hover:border-baseline-100 transition-colors">
      <input
        type="text"
        placeholder={`Filter ${column.name || column.columnName}...`}
        value={inputValue}
        onChange={handleInputChange}
        className="w-full bg-transparent text-sm outline-none placeholder-baseline-50"
      />
    </div>
  );
};
