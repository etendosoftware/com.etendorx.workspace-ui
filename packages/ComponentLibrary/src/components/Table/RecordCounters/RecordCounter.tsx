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
import LoadingSkeleton from "./LoadingSkeleton";
import type { RecordCounterProps } from "./types";

/**
 * RecordCounter component displays the count of loaded records versus total available records
 * Follows the EARS requirements for displaying record count information
 * Now supports internationalization through label props
 */
const RecordCounter: React.FC<RecordCounterProps> = ({
  totalRecords,
  loadedRecords,
  isLoading = false,
  labels = {},
}) => {
  // Default labels (fallback for English)
  const defaultLabels = {
    showingRecords: "Showing {count} records",
    showingPartialRecords: "Showing {loaded} of {total} records",
    recordsLoaded: "Records loaded",
  };

  const finalLabels = { ...defaultLabels, ...labels };

  // Handle loading state
  if (isLoading) {
    return <LoadingSkeleton width={120} height={20} data-testid="RecordCounter-loading" className="text-sm" />;
  }

  // Handle edge cases
  if (totalRecords < 0 || loadedRecords < 0) {
    return (
      <span data-testid="RecordCounter-fallback" className="text-sm font-medium text-gray-600">
        {finalLabels.recordsLoaded}
      </span>
    );
  }

  // Always show simple format: "Showing X records"
  return (
    <span data-testid="RecordCounter-simple" className="text-sm font-medium text-gray-600">
      {finalLabels.showingRecords.replace("{count}", loadedRecords.toString())}
    </span>
  );
};

export default RecordCounter;
