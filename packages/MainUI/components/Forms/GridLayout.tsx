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

import { Box, Paper, Typography } from "@mui/material";
import { useStyle } from "./styles";
import { GRID_CONSTANTS } from "./constants";
import EtendoImg from "../../../ComponentLibrary/src/assets/images/Etendo.svg?url";
import type { GridItemProps } from "./types";
import { useTranslation } from "../../hooks/useTranslation";

const GridItem = ({ bgColor = "transparent", children }: GridItemProps) => {
  const { styles } = useStyle();

  return (
    <Paper
      elevation={8}
      sx={{
        ...styles.gridItem,
        backgroundColor: bgColor,
        ...(bgColor !== "transparent" && styles.gridItemWithBg),
      }}>
      <Box sx={styles.gridItemContent}>{children}</Box>
    </Paper>
  );
};

const { ITEMS } = GRID_CONSTANTS;

const GridLayout = () => {
  const { styles } = useStyle();
  const { t } = useTranslation();

  return (
    <Box sx={styles.gridContainer}>
      <GridItem />
      <GridItem />
      <GridItem bgColor={ITEMS.ERP_SOFTWARE.color}>
        <Box sx={styles.gridText}>
          <Typography sx={{ fontSize: ITEMS.ERP_SOFTWARE.fontSize }}>{t("grid.items.erp.text")}</Typography>
        </Box>
      </GridItem>
      <GridItem bgColor={ITEMS.LOGO.color}>
        <Box component="img" src={EtendoImg} alt={t("grid.alt.logo")} sx={styles.gridImage} />
      </GridItem>
      <GridItem bgColor={ITEMS.TAILORED.color}>
        <Box sx={styles.gridTextYellow}>
          <Typography sx={{ fontSize: ITEMS.TAILORED.fontSize }}>{t("grid.items.tailored.text")}</Typography>
        </Box>
      </GridItem>
      <GridItem />
      <GridItem bgColor={ITEMS.HIGHLY_ADAPTABLE.color}>
        <Box sx={styles.gridTextYellow}>
          <Typography sx={{ fontSize: ITEMS.HIGHLY_ADAPTABLE.fontSize }}>{t("grid.items.adaptable.text")}</Typography>
        </Box>
      </GridItem>
      <GridItem />
      <GridItem />
    </Box>
  );
};

export default GridLayout;
