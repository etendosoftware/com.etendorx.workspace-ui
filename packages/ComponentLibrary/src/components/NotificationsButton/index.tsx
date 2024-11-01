'use client';
import React, { useState } from 'react';
import { Badge } from '@mui/material';
import { ExtendedNotificationButtonProps, NotificationModalProps } from './types';
import { notificationMax } from './constants';
import IconButton from '../IconButton';
import { useStyle } from './styles';

const NotificationButton: React.FC<ExtendedNotificationButtonProps> = ({
  notifications = [],
  children,
  icon,
  tooltipTitle = 'Notifications',
}) => {
  const { sx } = useStyle();
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
      <Badge
        badgeContent={notificationCount > notificationMax ? notificationMax + '+' : notificationCount}
        color="error"
        sx={sx.badgeStyles}
        component="div">
        <IconButton tooltip={tooltipTitle} onClick={handleClick}>
          {icon}
        </IconButton>
      </Badge>
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
