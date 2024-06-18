import React, { useState } from 'react';
import { Badge, IconButton, Tooltip } from '@mui/material';
import { NotificationsOutlined } from '@mui/icons-material';
import { ExtendedNotificationButtonProps } from './types';
import { notificationMax } from './constants';
import { styles, sx } from './styles';

const NotificationButton: React.FC<ExtendedNotificationButtonProps> = ({
  notifications = [],
  icon = <NotificationsOutlined sx={sx.iconStyles} />,
  tooltipTitle = 'Notificaciones',
  renderMenuContent,
  ...iconButtonProps
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    if (iconButtonProps.onClick) {
      iconButtonProps.onClick(event);
    }
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
      {renderMenuContent?.(
        notifications,
        handleClose,
        anchorEl,
        Boolean(anchorEl),
      )}
    </>
  );
};

export default NotificationButton;
