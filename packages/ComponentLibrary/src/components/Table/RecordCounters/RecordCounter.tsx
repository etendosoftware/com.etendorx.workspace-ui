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
import { Typography, Skeleton } from "@mui/material";
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
    return (
      <Skeleton
        variant="text"
        width={120}
        height={20}
        data-testid="RecordCounter-loading"
        sx={{ fontSize: "0.875rem" }}
      />
    );
  }

  // Handle edge cases
  if (totalRecords < 0 || loadedRecords < 0) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        data-testid="RecordCounter-fallback"
        sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
        {finalLabels.recordsLoaded}
      </Typography>
    );
  }

  // When totalRecords equals loadedRecords, show simplified format
  if (totalRecords === loadedRecords) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        data-testid="RecordCounter-simple"
        sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
        {finalLabels.showingRecords.replace("{count}", loadedRecords.toString())}
      </Typography>
    );
  }

  // When totalRecords > loadedRecords, show "X of Y" format
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      data-testid="RecordCounter-detailed"
      sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
      {finalLabels.showingPartialRecords
        .replace("{loaded}", loadedRecords.toString())
        .replace("{total}", totalRecords.toString())}
    </Typography>
  );
};

export default RecordCounter;
