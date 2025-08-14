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
import type { DefaultContentProps } from "./types";
import { useStyle } from "./styles";

export const DefaultContent: React.FC<DefaultContentProps> = ({ sections }) => {
  const { styles } = useStyle();

  return (
    <Box sx={styles.container}>
      {sections.map((section, index) => (
        <Box key={index} sx={styles.sectionContainer}>
          <Box sx={styles.sectionBox}>
            <Typography sx={styles.sectionTitle}>
              {section.title} ({section.items.length})
            </Typography>
            <Box sx={styles.itemsContainer}>
              {section.items.map((item, itemIndex) => (
                <Box key={itemIndex} sx={styles.itemBox}>
                  <Box sx={styles.itemIcon}>{item.icon}</Box>
                  <Typography sx={styles.itemText}>{item.name}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
};
