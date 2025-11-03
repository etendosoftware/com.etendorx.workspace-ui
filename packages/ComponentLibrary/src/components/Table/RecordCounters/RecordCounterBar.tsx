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
import { Box } from "@mui/material";
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
    <Box
      data-testid="RecordCounterBar"
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 16px",
        minHeight: "32px",
        backgroundColor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        flexShrink: 0,
        // Responsive design
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 1, sm: 0 },
      }}>
      {/* Record counter on the left */}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <RecordCounter
          totalRecords={totalRecords}
          loadedRecords={loadedRecords}
          isLoading={isLoading}
          labels={labels}
        />
      </Box>

      {/* Selection counter on the right */}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <SelectionCounter selectedCount={selectedCount} selectedLabel={labels.selectedRecords} />
      </Box>
    </Box>
  );
};

export default RecordCounterBar;
