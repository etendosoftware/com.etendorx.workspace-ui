import IconButton from '../../IconButton';
import { ToolbarSectionConfig } from '@workspaceui/storybook/src/stories/Components/Table/types';

const ToolbarSection: React.FC<ToolbarSectionConfig> = ({ buttons, style, className }) => {
  return (
    <div style={style} className={className}>
      {buttons.map(({ key, icon, iconText, tooltip, onClick, disabled, fill, hoverFill, width, height, sx }) => (
        <IconButton
          key={key}
          tooltip={tooltip}
          onClick={onClick}
          disabled={disabled}
          fill={fill}
          hoverFill={hoverFill}
          width={width}
          height={height}
          sx={sx}
          iconText={iconText}>
          {icon}
        </IconButton>
      ))}
    </div>
  );
};

export default ToolbarSection;
