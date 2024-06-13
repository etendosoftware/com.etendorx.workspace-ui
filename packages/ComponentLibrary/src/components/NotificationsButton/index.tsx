import React, { useState } from 'react';
import {
  Badge,
  IconButton,
  List,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { NOTIFICATIONS } from './mock';
import { NotificationsOutlined } from '@mui/icons-material';
import { styles, sx } from './styles';
import { NotificationButtonProps } from './types';

const NotificationButton: React.FC<NotificationButtonProps> = ({
  notifications,
  onClick,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const notificationCount = NOTIFICATIONS.length;

  return (
    <>
      <Tooltip title="Notificaciones" arrow>
        <IconButton
          onClick={handleClick}
          style={styles.iconButtonStyles}
          sx={sx.hoverStyles}>
          <Badge
            badgeContent={notificationCount > 99 ? '99+' : notificationCount}
            color="error"
            sx={sx.badgeStyles}>
            <NotificationsOutlined sx={sx.iconStyles} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <List>
          {notifications.map(notification => (
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
