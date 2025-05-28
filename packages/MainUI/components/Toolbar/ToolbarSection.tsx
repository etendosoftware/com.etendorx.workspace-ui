import type { ToolbarSectionConfig } from './types';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';

const ToolbarSection: React.FC<ToolbarSectionConfig> = ({ buttons, style, className }) => {
  return (
    <div style={style} className={className}>
      {buttons.map(({ key, icon, iconText, tooltip, onClick, disabled, ref, className }) => (
        <IconButton
          key={key}
          ref={ref}
          tooltip={tooltip}
          onClick={onClick}
          disabled={disabled}
          className={className}
          iconText={iconText}>
          {icon}
        </IconButton>
      ))}
    </div>
  );
};

export default ToolbarSection;
