import { Box, Grid, Typography } from '@mui/material';
import { sx } from '../styles';
import IconButton from '../../IconButton';
import InformationIcon from '../../../../public/icons/info.svg';
import { ContentGridProps, Widget } from '../../../../../storybook/src/stories/Components/Table/types';

const WidgetComponent: React.FC<Widget> = ({
  title,
  icon,
  iconButtonAction,
  tooltip,
  color,
  bgcolor,
  children,
  iconBgColor,
  iconButtonColor,
  iconButtonHoverColor,
  iconButtonBgColor,
  iconButtonHoverBgColor,
}) => (
  <Box sx={{ ...sx.widgetContainer, background: bgcolor, color: color }}>
    <Box sx={sx.widgetHeader}>
      <Box sx={sx.widgetHeaderLeft}>
        <Box
          sx={{
            ...sx.widgetHeaderIcon,
            background: iconBgColor ?? 'transparent',
          }}>
          {icon}
        </Box>
        <Typography sx={{ ml: 1 }}>{title}</Typography>
      </Box>
      {iconButtonAction && (
        <IconButton
          width={16}
          height={16}
          tooltip={tooltip}
          onClick={iconButtonAction}
          fill={iconButtonColor}
          hoverFill={iconButtonHoverColor}
          sx={{
            background: iconButtonBgColor,
            '&:hover': { background: iconButtonHoverBgColor },
          }}>
          <InformationIcon />
        </IconButton>
      )}
    </Box>
    <Box sx={sx.widgetBox}>{children}</Box>
  </Box>
);

const ContentGrid: React.FC<ContentGridProps> = ({ widgets }) => {
  const getGridSize = (size?: Widget['size']) => (size === 'full' ? 12 : 6);

  return (
    <Box sx={sx.gridContainer}>
      <Grid container columnSpacing="0.75rem">
        {widgets.map(widget => (
          <Grid item key={widget.id} xs={getGridSize(widget.size)}>
            <WidgetComponent {...widget} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ContentGrid;
