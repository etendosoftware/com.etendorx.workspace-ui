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
import { Chip as MuiChip } from "@mui/material";
import { useStyle } from "./styles";
import type { TagProps } from "./types";

const Tag: React.FC<TagProps> = ({ label, icon, tagColor, onClick }) => {
  const styles = useStyle();
  const coloredIcon = icon && styles.getColoredIcon(icon, tagColor);

  return (
    <MuiChip
      icon={coloredIcon}
      label={label}
      onClick={onClick}
      variant="outlined"
      style={styles.getChipStyles(tagColor)}
      sx={styles.sx.chipLabel(icon)}
    />
  );
};

export default Tag;
