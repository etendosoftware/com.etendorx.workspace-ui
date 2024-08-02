import React from 'react';
import {
  ListItem,
  Typography,
  IconButton,
  Button,
  styled,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { NotificationItemProps } from './types';
import Tag from '../Tag';
import { styles } from './styles';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CloseIcon from '../../assets/icons/x.svg';
import { theme } from '../../theme';

const NotificationItem: React.FC<NotificationItemProps> = ({
  description,
  priority,
  tagType,
  date,
  icon: IconComponent,
  ctaButtons,
}) => {
  const StyledListItem = styled('div')(() => ({
    width: '27.25rem',
    borderRadius: '0.75rem',
    margin: '-0.25rem',
    padding: '0.75rem 1rem',
    display: 'flex',
    position: 'relative',
    backgroundColor: theme.palette.baselineColor.neutral[0],
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
    '&:hover': {
      backgroundColor: theme.palette.baselineColor.neutral[10],
      outline: `2px solid ${theme.palette.dynamicColor.main}`,
      '& .closeIcon': {
        visibility: 'visible',
      },
      '& > .textContainer': {
        paddingRight: '1.5rem',
      },
    },
  }));

  const markdownComponents = {
    a: ({ ...props }) => <a style={styles.anchorStyles} {...props} />,
    p: ({ ...props }) => <div {...props} />,
  };
  return (
    <ListItem component="div" style={styles.listContainer}>
      <StyledListItem>
        <IconButton style={styles.closeIcon}>
          <CloseIcon
            fill={theme.palette.baselineColor.neutral[80]}
            width={'1.094rem'}
            height={'1.094rem'}
            className="closeIcon"
          />
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
      </StyledListItem>
    </ListItem>
  );
};

export default NotificationItem;
