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
import ContentGrid from "./WidgetContent";
import { useStyle } from "../styles";
import RegisterModal from "../../RegisterModal";
import type { SidebarContentProps } from "./types";

export const SidebarContent: React.FC<SidebarContentProps> = ({ icon, identifier, title, widgets, translations }) => {
  const { sx } = useStyle();

  return (
    <Box sx={sx.sidebarContainer}>
      <Box sx={sx.headerContainer}>
        <Box sx={sx.iconContainer}>{icon}</Box>
        <Box>
          <Typography variant="body2" sx={sx.identifier}>
            {identifier}
          </Typography>
          <Typography variant="h5" sx={sx.title}>
            {title}
          </Typography>
        </Box>
      </Box>
      <Box ml={2.5}>
        <RegisterModal registerText={translations.register} translations={translations} />
      </Box>
      <ContentGrid widgets={widgets} />
    </Box>
  );
};

export default SidebarContent;
