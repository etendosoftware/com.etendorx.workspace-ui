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
      }}
      data-testid="Paper__b08f17_1">
      <Box sx={styles.gridItemContent} data-testid="Box__b08f17_1">
        {children}
      </Box>
    </Paper>
  );
};

const { ITEMS } = GRID_CONSTANTS;

const GridLayout = () => {
  const { styles } = useStyle();
  const { t } = useTranslation();

  return (
    <Box sx={styles.gridContainer} data-testid="Box__b08f17_2">
      <GridItem data-testid="GridItem__b08f17_1" />
      <GridItem data-testid="GridItem__b08f17_2" />
      <GridItem bgColor={ITEMS.ERP_SOFTWARE.color} data-testid="GridItem__b08f17_3">
        <Box sx={styles.gridText} data-testid="Box__b08f17_3">
          <Typography sx={{ fontSize: ITEMS.ERP_SOFTWARE.fontSize }} data-testid="Typography__b08f17_1">
            {t("grid.items.erp.text")}
          </Typography>
        </Box>
      </GridItem>
      <GridItem bgColor={ITEMS.LOGO.color} data-testid="GridItem__b08f17_4">
        <Box
          component="img"
          src={EtendoImg}
          alt={t("grid.alt.logo")}
          sx={styles.gridImage}
          data-testid="Box__b08f17_4"
        />
      </GridItem>
      <GridItem bgColor={ITEMS.TAILORED.color} data-testid="GridItem__b08f17_5">
        <Box sx={styles.gridTextYellow} data-testid="Box__b08f17_5">
          <Typography sx={{ fontSize: ITEMS.TAILORED.fontSize }} data-testid="Typography__b08f17_2">
            {t("grid.items.tailored.text")}
          </Typography>
        </Box>
      </GridItem>
      <GridItem data-testid="GridItem__b08f17_6" />
      <GridItem bgColor={ITEMS.HIGHLY_ADAPTABLE.color} data-testid="GridItem__b08f17_7">
        <Box sx={styles.gridTextYellow} data-testid="Box__b08f17_6">
          <Typography sx={{ fontSize: ITEMS.HIGHLY_ADAPTABLE.fontSize }} data-testid="Typography__b08f17_3">
            {t("grid.items.adaptable.text")}
          </Typography>
        </Box>
      </GridItem>
      <GridItem data-testid="GridItem__b08f17_8" />
      <GridItem data-testid="GridItem__b08f17_9" />
    </Box>
  );
};

export default GridLayout;
