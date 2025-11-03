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

import React from "react";
import RecordCounter from "./RecordCounter";
import SelectionCounter from "./SelectionCounter";
import type { RecordCounterBarProps } from "./types";

/**
 * RecordCounterBar is a container component that holds both record and selection counters
 * Provides responsive layout and consistent styling for counter components
 * Positioned above the grid to provide context without interfering with functionality
 * Now supports internationalization through labels prop
 */
const RecordCounterBar: React.FC<RecordCounterBarProps> = ({
  totalRecords,
  loadedRecords,
  selectedCount,
  isLoading = false,
  labels = {},
}) => {
  return (
    <div
      data-testid="RecordCounterBar"
      className="flex justify-between items-center px-4 py-2 min-h-8 bg-white border-b border-gray-200 flex-shrink-0 flex-col sm:flex-row gap-4 sm:gap-0">
      {/* Record counter on the left */}
      <div className="flex items-center">
        <RecordCounter
          totalRecords={totalRecords}
          loadedRecords={loadedRecords}
          isLoading={isLoading}
          labels={labels}
        />
      </div>

      {/* Selection counter on the right */}
      <div className="flex items-center">
        <SelectionCounter selectedCount={selectedCount} selectedLabel={labels.selectedRecords} />
      </div>
    </div>
  );
};

export default RecordCounterBar;
