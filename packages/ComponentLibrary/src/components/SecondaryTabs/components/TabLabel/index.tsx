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

import { Box, Badge, CircularProgress, useTheme } from "@mui/material";
import type { TabLabelProps } from "./types";
import { useStyle } from "./styles";

const TabLabel: React.FC<TabLabelProps & { isSelected?: boolean }> = ({ icon, text, count, isLoading }) => {
  const theme = useTheme();
  const { styles } = useStyle();

  return (
    <Box sx={styles.tabLabelContainerStyles}>
      <Box sx={styles.tabLabelContainerStyles}>{icon}</Box>
      <span style={{ ...styles.badgeTextStyles }}>{text}</span>
      {isLoading ? (
        <CircularProgress size={16} sx={{ color: theme.palette.baselineColor.neutral[80] }} />
      ) : (
        !!count && <Badge badgeContent={count} color="secondary" sx={styles.badgeStyles} />
      )}
    </Box>
  );
};

export default TabLabel;
