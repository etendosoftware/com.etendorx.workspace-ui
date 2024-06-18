import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Link,
  Menu,
  Button,
  IconButton,
} from '@mui/material';
import { INotificationModalProps } from './types';
import { menuSyle, styles } from './styles';
import { MoreVert, Settings } from '@mui/icons-material';

const NotificationModalCustom: React.FC<INotificationModalProps> = ({
  notifications,
  handleClose,
  title,
  linkTitle,
  anchorEl,
  open,
  emptyStateImage,
  emptyStateImageAlt,
  emptyStateMessage,
  emptyStateDescription,
  actionButtonLabel,
  ...props
}) => {
  return (
    <Menu
      {...props}
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: { sx: styles.paperStyleMenu },
      }}
      MenuListProps={{ sx: menuSyle }}>
      <div style={styles.titleModalContainer}>
        <div style={styles.titleModalImageContainer}>
          {title?.icon && (
            <div style={styles.titleModalImageRadius}>
              <img
                style={styles.titleModalImage}
                src={title.icon}
                alt="Notification Icon"
              />
            </div>
          )}
          <div style={styles.titleModal}>{title?.label}</div>
        </div>
        <div style={styles.rigthContainer}>
          {linkTitle && (
            <Link style={styles.titleButton} href={linkTitle.url}>
              {linkTitle.label}
            </Link>
          )}
          <IconButton style={styles.titleModalImage}>
            <MoreVert
              sx={{
                '&:hover': {
                  color: 'black ',
                },
              }}
            />
          </IconButton>
        </div>
      </div>
      <div style={styles.listContainer}>
        {notifications.length === 0 ? (
          <div style={styles.emptyState}>
            <img
              src={emptyStateImage}
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
                onClick={handleClose}
                variant="contained"
                startIcon={<Settings />}
                sx={{
                  background: '#F5F8FF',
                  color: '#00030DB2',
                  '&:hover': {
                    border: 'none',
                    background: '#151C7A',
                    color: 'white',
                  },
                }}>
                <div style={styles.actionButtonText}>{actionButtonLabel}</div>
              </Button>
            </div>
          </div>
        ) : (
          <List>
            {notifications.map(notification => (
              <ListItem
                key={notification.id}
                onClick={handleClose}
                component="div">
                <ListItemText primary={notification.message} />
              </ListItem>
            ))}
          </List>
        )}
      </div>
    </Menu>
  );
};

export default NotificationModalCustom;
