import React, { useState } from 'react';
import { Badge, IconButton, Tooltip } from '@mui/material';
import { NotificationsOutlined } from '@mui/icons-material';
import {
  ExtendedNotificationButtonProps,
  NotificationModalProps,
} from './types';
import { notificationMax } from './constants';
import { styles, sx } from './styles';

const NotificationButton: React.FC<ExtendedNotificationButtonProps> = ({
  notifications = [],
  children,
  icon = <NotificationsOutlined sx={sx.iconStyles} />,
  tooltipTitle = 'Notificaciones',
  ...iconButtonProps
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const notificationCount: number = notifications.length;

  return (
    <>
      <Tooltip title={tooltipTitle} arrow>
        <IconButton
          onClick={handleClick}
          {...iconButtonProps}
          style={styles.iconButtonStyles}
          sx={sx.hoverStyles}>
          <Badge
            badgeContent={
              notificationCount > notificationMax
                ? notificationMax + '+'
                : notificationCount
            }
            color="error"
            sx={sx.badgeStyles}>
            {icon}
          </Badge>
        </IconButton>
      </Tooltip>
      {children &&
        React.cloneElement(children, {
          anchorEl,
          open: Boolean(anchorEl),
          onClose: handleClose,
          notifications,
        } as NotificationModalProps)}
    </>
  );
};

export default NotificationButton;
