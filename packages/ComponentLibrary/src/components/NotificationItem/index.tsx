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

import { ListItem, Typography, Button, Box } from "@mui/material";
import ReactMarkdown from "react-markdown";
import type { NotificationItemProps } from "./types";
import Tag from "../Tag";
import { useStyle } from "./styles";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CloseIcon from "../../assets/icons/x.svg";
import IconButton from "../IconButton";

const NotificationItem: React.FC<NotificationItemProps> = ({
  description,
  priority,
  tagType,
  date,
  icon: IconComponent,
  ctaButtons,
}) => {
  const { styles, sx } = useStyle();
  const markdownComponents = {
    a: ({ ...props }) => <a style={styles.anchorStyles} {...props} />,
    p: ({ ...props }) => <div {...props} />,
  };

  return (
    <ListItem component="div" sx={sx.listItem}>
      <Box sx={sx.notificationBox}>
        <IconButton>
          <CloseIcon className="closeIcon" />
        </IconButton>
        <div style={styles.iconContainerStyles}>
          <IconComponent />
        </div>
        <div style={styles.textContainerStyles} className="textContainer">
          <ReactMarkdown components={markdownComponents}>{description}</ReactMarkdown>
          {priority && tagType && <Tag type={tagType} label={priority} />}
          {ctaButtons && (
            <div style={styles.ctaButtonContainer}>
              {ctaButtons.map((button) => (
                <Button
                  key={button.key}
                  variant="contained"
                  onClick={button.action}
                  sx={button.sx}
                  startIcon={button.icon ? <button.icon /> : null}>
                  {button.label}
                </Button>
              ))}
            </div>
          )}
          <div style={styles.dateContainer}>
            <CalendarTodayOutlinedIcon style={styles.dateStyles} />
            <Typography variant="body2" color="textSecondary" style={styles.dateStyles}>
              {date}
            </Typography>
          </div>
        </div>
      </Box>
    </ListItem>
  );
};

export default NotificationItem;
