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

import { Box, Grid, Typography } from "@mui/material";
import { useStyle } from "../styles";
import IconButton from "../../IconButton";
import InformationIcon from "../../../assets/icons/info.svg";
// type ContentGridProps = any;
// type Widget = any;
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type ContentGridProps = any;
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Widget = any;

const WidgetComponent: React.FC<Widget> = ({
  title,
  icon,
  iconButtonAction,
  tooltip,
  color,
  bgcolor,
  children,
  iconBgColor,
}) => {
  const { sx } = useStyle();

  return (
    <Box sx={{ ...sx.widgetContainer, background: bgcolor, color: color }}>
      <Box sx={sx.widgetHeader}>
        <Box sx={sx.widgetHeaderLeft}>
          <Box
            sx={{
              ...sx.widgetHeaderIcon,
              background: iconBgColor ?? "transparent",
            }}>
            {icon}
          </Box>
          <Typography sx={{ ml: 1 }}>{title}</Typography>
        </Box>
        {iconButtonAction && (
          <IconButton tooltip={tooltip} onClick={iconButtonAction}>
            <InformationIcon />
          </IconButton>
        )}
      </Box>
      <Box sx={sx.widgetBox}>{children}</Box>
    </Box>
  );
};

const ContentGrid: React.FC<ContentGridProps> = ({ widgets }) => {
  const getGridSize = (size?: Widget["size"]) => (size === "full" ? 12 : 6);
  const { sx } = useStyle();

  return (
    <Box sx={sx.gridContainer}>
      <Grid container columnSpacing="0.75rem">
        {widgets.map((widget: any) => (
          <Grid item key={widget.id} xs={getGridSize(widget.size)}>
            <WidgetComponent {...widget} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ContentGrid;
