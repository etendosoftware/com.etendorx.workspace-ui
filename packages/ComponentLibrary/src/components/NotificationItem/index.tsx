import React from 'react';
import { ListItem, Typography, IconButton, Button } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { NotificationItemProps } from './types';
import Tag from '../Tag';
import { styles, StyledListItem } from './styles';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CloseIcon from '@mui/icons-material/Close';

const NotificationItem: React.FC<NotificationItemProps> = ({
  description,
  priority,
  tagType,
  date,
  icon: IconComponent,
  ctaButtons,
}) => {
  return (
    <ListItem component="div" style={styles.listContainer}>
      <StyledListItem>
        <IconButton style={styles.closeIcon}>
          <CloseIcon className="closeIcon" />
        </IconButton>
        <div style={styles.iconContainerStyles}>
          <IconComponent />
        </div>
        <div style={styles.textContainerStyles} className="textContainer">
          <ReactMarkdown
            components={{
              p: props => <div {...props} />,
            }}>
            {description}
          </ReactMarkdown>
          {priority && tagType && <Tag type={tagType} label={priority} />}
          {ctaButtons && (
            <div style={styles.ctaButtonContainer}>
              {ctaButtons.map(button => (
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
            <Typography
              variant="body2"
              color="textSecondary"
              style={styles.dateStyles}>
              {date}
            </Typography>
          </div>
        </div>
      </StyledListItem>
    </ListItem>
  );
};

export default NotificationItem;
