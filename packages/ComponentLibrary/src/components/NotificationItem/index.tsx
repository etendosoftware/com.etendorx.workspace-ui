import { ListItem, Typography, IconButton, Button, Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { NotificationItemProps } from './types';
import Tag from '../Tag';
import { styles, sx } from './styles';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CloseIcon from '../../assets/icons/x.svg';

const NotificationItem: React.FC<NotificationItemProps> = ({
  description,
  priority,
  tagType,
  date,
  icon: IconComponent,
  ctaButtons,
}) => {
  const markdownComponents = {
    a: ({ ...props }) => <a style={styles.anchorStyles} {...props} />,
    p: ({ ...props }) => <div {...props} />,
  };

  return (
    <ListItem component="div" sx={sx.listItem}>
      <Box sx={sx.notificationBox}>
        <IconButton sx={sx.closeIconButton}>
          <CloseIcon className="closeIcon" />
        </IconButton>
        <div style={styles.iconContainerStyles}>
          <IconComponent />
        </div>
        <div style={styles.textContainerStyles} className="textContainer">
          <ReactMarkdown components={markdownComponents}>
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
      </Box>
    </ListItem>
  );
};

export default NotificationItem;
