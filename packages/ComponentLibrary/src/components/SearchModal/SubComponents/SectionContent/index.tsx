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
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import type { Section } from "../../../SecondaryTabs/types";
import { useStyle } from "./styles";
import { ItemContent } from "../ItemContent";

export const SectionContent: React.FC<{ section: Section; isLast: boolean; variant: "default" | "tabs" }> = ({
  section,
  isLast,
}) => {
  const { styles } = useStyle();

  return (
    <Box sx={styles.sectionContent}>
      <Box sx={styles.sectionBox(isLast)}>
        <Box sx={styles.sectionInnerBox}>
          <Box sx={styles.contentWrapper}>
            <Box sx={styles.sectionTitleContainer}>
              <Typography sx={styles.sectionTitle}>
                {section.title} ({section.items.length})
              </Typography>
              <ArrowForwardIcon sx={styles.arrowIcon} />
            </Box>
            <Box sx={styles.itemsContainer}>
              {section.items.map((item, index) => (
                <ItemContent key={index} item={item} />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
