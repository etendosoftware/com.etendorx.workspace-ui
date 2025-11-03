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
import { Typography } from "@mui/material";
import type { SelectionCounterProps } from "./types";

/**
 * SelectionCounter component displays the number of currently selected records
 * Only renders when there are selected records (selectedCount > 0)
 * Follows the EARS requirements for selection count visibility
 * Now supports internationalization through selectedLabel prop
 */
const SelectionCounter: React.FC<SelectionCounterProps> = ({ selectedCount, selectedLabel = "{count} selected" }) => {
  // Don't render when no records are selected
  if (selectedCount <= 0) {
    return null;
  }

  return (
    <Typography
      variant="body2"
      color="primary"
      data-testid="SelectionCounter"
      sx={{
        fontSize: "0.875rem",
        fontWeight: 600,
        color: "primary.main",
      }}>
      {selectedLabel.replace("{count}", selectedCount.toString())}
    </Typography>
  );
};

export default SelectionCounter;
