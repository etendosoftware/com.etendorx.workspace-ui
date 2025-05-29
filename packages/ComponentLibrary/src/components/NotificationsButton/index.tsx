'use client';
import { Badge } from '@mui/material';
import React, { useRef, useState } from 'react';
import IconButton from '../IconButton';
import { notificationMax } from './constants';
import { useStyle } from './styles';
import type { ExtendedNotificationButtonProps, NotificationModalProps } from './types';

const NotificationButton: React.FC<ExtendedNotificationButtonProps> = ({
  notifications = [],
  children,
  icon,
  tooltipTitle = 'Notifications',
}) => {
  const { sx } = useStyle();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isOpenMenu, setIsOpenMenu] = useState<boolean>(false);
  const handleClick = () => {
    setIsOpenMenu(true);
  };

  const handleClose = () => {
    setIsOpenMenu(false);
  };

  const notificationCount: number = notifications.length;

  return (
    <>
      <Badge
        badgeContent={notificationCount > notificationMax ? `${notificationMax}+` : notificationCount}
        color='error'
        sx={sx.badgeStyles}
        component='div'>
        <IconButton tooltip={tooltipTitle} onClick={handleClick} disabled={true} className='w-10 h-10'>
          {icon}
        </IconButton>
      </Badge>
      {children &&
        React.cloneElement(children, {
          anchorRef: buttonRef,
          open: isOpenMenu,
          onClose: handleClose,
          notifications,
        } as unknown as NotificationModalProps)}
    </>
  );
};

export default NotificationButton;
