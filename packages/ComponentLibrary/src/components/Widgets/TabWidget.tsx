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

import { Box, Typography } from "@mui/material";
import { useStyle } from "./styles";
import type { TabWidgetProps } from "./types";

const TabWidget: React.FC<TabWidgetProps> = ({ title, content, noRecordText }) => {
  const { sx } = useStyle();

  if (!content) {
    return <Typography variant="h5">{noRecordText}</Typography>;
  }

  return (
    <Box sx={sx.mainContainer}>
      <Box flexGrow={1} overflow="auto" p={2}>
        <Typography variant="h5" fontWeight="medium" mb={2}>
          {title}
        </Typography>
        <Box>{content}</Box>
      </Box>
    </Box>
  );
};

export default TabWidget;
