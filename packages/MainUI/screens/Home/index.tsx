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
    <Container maxWidth="lg" sx={styles.container}>
      <Box sx={styles.headerContainer}>
        <Typography variant="h4" component="h1" sx={styles.pageTitle} gutterBottom>
          {t("common.etendo")} {t("breadcrumb.home")}
        </Typography>
        <Typography variant="subtitle1" sx={styles.pageSubtitle}>
          {t("table.content.currentTitle")}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {dashboardWidgets.map((widget) => (
          <Grid item key={widget.id} xs={12} md={widget.size === "full" ? 12 : 6}>
            <Box
              sx={{
                ...styles.widgetContainer,
                bgcolor: widget.bgcolor,
                color: widget.color,
              }}>
              <Box sx={styles.widgetHeader}>
                <Box sx={styles.widgetTitleContainer}>
                  <Box
                    sx={{
                      ...styles.iconContainer,
                      bgcolor: widget.iconBgColor,
                    }}>
                    {widget.icon}
                  </Box>
                  <Typography variant="h6" sx={styles.widgetTitle}>
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
                  title={widget.tooltip || t("table.tooltips.details")}>
                  {widget.icon}
                </Box>
              </Box>
              <Box sx={styles.widgetContent}>{widget.children}</Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
