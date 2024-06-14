import React, { useState } from 'react';
import {
  Badge,
  IconButton,
  List,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { NotificationsOutlined } from '@mui/icons-material';
import { styles, sx } from './styles';
import { NotificationButtonProps } from './types';
import { notificationMax } from './constants';

const NotificationButton: React.FC<NotificationButtonProps> = ({
  notifications,
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

  const notificationCount: number = notifications?.length ?? 0;

  return (
    <>
      <Tooltip title="Notificaciones" arrow>
        <IconButton
          onClick={handleClick}
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
            <NotificationsOutlined sx={sx.iconStyles} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <List>
          {notifications?.map(notification => (
            <MenuItem key={notification.id} onClick={handleClose}>
              {notification.message}
            </MenuItem>
          ))}
        </List>
      </Menu>
    </>
  );
};

export default NotificationButton;
