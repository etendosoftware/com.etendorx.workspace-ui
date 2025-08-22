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

"use client";

import { Box, Grid, Typography, Container } from "@mui/material";
import { createWidgets } from "../../../storybook/src/stories/Components/Table/mockWidget";
import { useTranslation } from "@/hooks/useTranslation";
import useStyles from "./styles";

export default function Home() {
  const { t } = useTranslation();
  const styles = useStyles();

  const widgets = createWidgets(t);
  const dashboardWidgets = [widgets[1], widgets[2], widgets[4], widgets[5], widgets[7], widgets[8]];

  return (
    <Container maxWidth="lg" sx={styles.container} data-testid="Container__3ef224_1">
      <Box sx={styles.headerContainer} data-testid="Box__3ef224_header">
        <Typography
          variant="h4"
          component="h1"
          sx={styles.pageTitle}
          gutterBottom
          data-testid="Typography__3ef224_title">
          {t("common.etendo")} {t("breadcrumb.home")}
        </Typography>
        <Typography variant="subtitle1" sx={styles.pageSubtitle} data-testid="Typography__3ef224_subtitle">
          {t("table.content.currentTitle")}
        </Typography>
      </Box>
      <Grid container spacing={3} data-testid="Grid__3ef224_container">
        {dashboardWidgets.map((widget) => (
          <Grid
            item
            key={widget.id}
            xs={12}
            md={widget.size === "full" ? 12 : 6}
            data-testid={`Grid__3ef224_item_${widget.id}`}>
            <Box
              sx={{
                ...styles.widgetContainer,
                bgcolor: widget.bgcolor,
                color: widget.color,
              }}
              data-testid={`Box__3ef224_container_${widget.id}`}>
              <Box sx={styles.widgetHeader} data-testid={`Box__3ef224_header_${widget.id}`}>
                <Box sx={styles.widgetTitleContainer} data-testid={`Box__3ef224_title_${widget.id}`}>
                  <Box
                    sx={{
                      ...styles.iconContainer,
                      bgcolor: widget.iconBgColor,
                    }}
                    data-testid={`Box__3ef224_icon_${widget.id}`}>
                    {widget.icon}
                  </Box>
                  <Typography variant="h6" sx={styles.widgetTitle} data-testid={`Typography__3ef224_${widget.id}`}>
                    {widget.title}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    ...styles.actionButton,
                    bgcolor: widget.iconButtonBgColor,
                    "&:hover": {
                      bgcolor: widget.iconButtonHoverBgColor,
                      "& svg": {
                        fill: widget.iconButtonHoverColor,
                      },
                    },
                  }}
                  onClick={widget.iconButtonAction}
                  title={widget.tooltip || t("table.tooltips.details")}
                  data-testid={`Box__3ef224_action_${widget.id}`}>
                  {widget.icon}
                </Box>
              </Box>
              <Box sx={styles.widgetContent} data-testid={`Box__3ef224_content_${widget.id}`}>
                {widget.children}
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
