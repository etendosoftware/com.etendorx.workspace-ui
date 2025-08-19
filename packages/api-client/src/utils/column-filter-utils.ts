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

import type { Column, BaseCriteria } from "../api/types";
import { FieldType } from "../api/types";

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

export interface ColumnFilterState {
  id: string; // column id
  selectedOptions: FilterOption[];
  isMultiSelect: boolean;
  availableOptions: FilterOption[];
  loading: boolean;
  searchQuery?: string;
}

export interface ColumnFilterProps {
  column: Column;
  onFilterChange: (columnId: string, selectedOptions: FilterOption[]) => void;
  currentFilter?: ColumnFilterState;
}

export class ColumnFilterUtils {
  /**
   * Check if a column supports dropdown filtering (select or tabledir)
   */
  static supportsDropdownFilter(column: Column): boolean {
    return column.type === FieldType.SELECT || column.type === FieldType.TABLEDIR;
  }

  /**
   * Check if a column is a select type (uses refList)
   */
  static isSelectColumn(column: Column): boolean {
    return column.type === FieldType.SELECT && Array.isArray(column.refList);
  }

  /**
   * Check if a column is a tabledir type (uses referencedEntity)
   */
  static isTableDirColumn(column: Column): boolean {
    return column.type === FieldType.TABLEDIR && !!column.referencedEntity;
  }

  /**
   * Check if a column needs distinct values from the current table instead of full entity list
   * TABLE_DIR columns should use distinct values from current table for better filtering
   */
  static needsDistinctValues(column: Column): boolean {
    return ColumnFilterUtils.isTableDirColumn(column);
  }

  /**
   * Get filter options for a select column (from refList)
   */
  static getSelectOptions(column: Column): FilterOption[] {
    if (!ColumnFilterUtils.isSelectColumn(column) || !column.refList) {
      return [];
    }

    return ((column.refList as any[]) || []).map((item: any) => ({
      id: item.id,
      label: item.label,
      value: item.value,
    }));
  }

  /**
   * Create criteria for column filters
   */
  static createColumnFilterCriteria(columnFilters: ColumnFilterState[]): BaseCriteria[] {
    const criteria: BaseCriteria[] = [];

    for (const filter of columnFilters) {
      if (filter.selectedOptions.length === 0) continue;

      if (filter.selectedOptions.length === 1) {
        // Single selection
        criteria.push({
          fieldName: filter.id,
          operator: "equals",
          value: filter.selectedOptions[0].value,
        });
      } else {
        // Multiple selections - create OR criteria
        const orCriteria: BaseCriteria[] = filter.selectedOptions.map((option) => ({
          fieldName: filter.id,
          operator: "equals",
          value: option.value,
        }));

        criteria.push({
          operator: "or",
          criteria: orCriteria,
        } as unknown as BaseCriteria);
      }
    }

    return criteria;
  }

  /**
   * Convert column filter state to criteria that matches Etendo Classic format
   */
  static createEtendoClassicCriteria(columnFilters: ColumnFilterState[]): string | null {
    if (columnFilters.length === 0) return null;

    const criteriaGroups: Record<string, unknown>[] = [];

    for (const filter of columnFilters) {
      if (filter.selectedOptions.length === 0) continue;

      if (filter.selectedOptions.length === 1) {
        criteriaGroups.push({
          fieldName: filter.id,
          operator: "equals",
          value: filter.selectedOptions[0].value,
          _constructor: "AdvancedCriteria",
        });
      } else {
        // Multiple selections - create OR group
        const orCriteria = filter.selectedOptions.map((option) => ({
          fieldName: filter.id,
          operator: "equals",
          value: option.value,
          _constructor: "AdvancedCriteria",
        }));

        criteriaGroups.push({
          operator: "or",
          criteria: orCriteria,
          _constructor: "AdvancedCriteria",
        });
      }
    }

    if (criteriaGroups.length === 1) {
      return JSON.stringify(criteriaGroups[0]);
    }

    // Multiple filter groups - combine with AND
    return JSON.stringify({
      operator: "and",
      criteria: criteriaGroups,
      _constructor: "AdvancedCriteria",
    });
  }
}
