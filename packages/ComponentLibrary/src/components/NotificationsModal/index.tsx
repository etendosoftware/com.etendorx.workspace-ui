import React from 'react';
import { List, Link, Menu, Button } from '@mui/material';
import IconButton from '../IconButton/index';
import { INotificationModalProps } from './types';
import { menuSyle, styles, sx } from './styles';
import { Settings } from '@mui/icons-material';
import MoreVert from '../../assets/icons/more-vertical.svg';
import NotificationItem from '../NotificationItem';
import Image from '../../assets/images/NotificationModal/empty-state-notifications.svg?url';
import { theme } from '../../theme';

const NotificationModalCustom: React.FC<INotificationModalProps> = ({
  title,
  linkTitle,
  emptyStateImageAlt,
  emptyStateMessage,
  emptyStateDescription,
  actionButtonLabel,
  notifications = [],
  onClose,
  ...props
}) => {
  return (
    <Menu
      open
      {...props}
      onClose={onClose}
      slotProps={{
        paper: { sx: styles.paperStyleMenu },
      }}
      MenuListProps={{ sx: menuSyle }}>
      <div style={styles.titleModalContainer}>
        <div style={styles.titleModalImageContainer}>
          {title?.icon && (
            <div style={styles.titleModalImageRadius}>{title?.icon}</div>
          )}
          <div style={styles.titleModal}>{title?.label}</div>
        </div>
        <div style={styles.rigthContainer}>
          {linkTitle && (
            <Link sx={sx.linkStyles} href={linkTitle.url}>
              {linkTitle.label}
            </Link>
          )}
          <div style={styles.titleModalButtonContainer}>
            <IconButton
              width={20}
              height={20}
              fill={theme.palette.baselineColor.neutral[70]}
              hoverFill={theme.palette.baselineColor.neutral[100]}
              sx={{
                '&:hover': {
                  background:
                    theme.palette.baselineColor.transparentNeutral[10],
                },
              }}>
              <MoreVert />
            </IconButton>
          </div>
        </div>
      </div>
      <div style={styles.listContainer}>
        {notifications.length === 0 ? (
          <div style={styles.emptyState}>
            <img
              src={Image}
              alt={emptyStateImageAlt}
              style={styles.emptyStateImage}
            />
            <div style={styles.emptyTextContainer}>
              <div style={styles.emptyHeader}>{emptyStateMessage}</div>
              <div style={styles.emptyText}>{emptyStateDescription}</div>
            </div>
            <div style={styles.actionButtonContainer}>
              <Button
                style={styles.actionButton}
                variant="contained"
                startIcon={<Settings />}
                sx={sx.actionButton}>
                <div style={styles.actionButtonText}>{actionButtonLabel}</div>
              </Button>
            </div>
          </div>
        ) : (
          <List>
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                description={notification.description}
                priority={notification.priority}
                date={notification.date}
                tagType={notification.tagType}
                ctaButtons={notification.ctaButtons}
                icon={notification.icon}
              />
            ))}
          </List>
        )}
      </div>
    </Menu>
  );
};

export default NotificationModalCustom;
