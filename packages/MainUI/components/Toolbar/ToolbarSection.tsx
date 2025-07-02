import type { ToolbarSectionConfig } from "./types";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";

const ToolbarSection: React.FC<ToolbarSectionConfig> = ({ buttons, style, className }) => {
  return (
    <div style={style} className={className}>
      {buttons.map(({ key, icon, iconText, tooltip, onClick, disabled, className }) => (
        <IconButton
          key={key}
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
