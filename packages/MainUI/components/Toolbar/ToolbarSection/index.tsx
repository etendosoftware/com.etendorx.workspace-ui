import type { ToolbarSectionConfig } from "../types";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";

const ToolbarSection: React.FC<ToolbarSectionConfig> = ({ buttons, style = {}, className = "", processButton }) => {
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
      {processButton && !processButton.disabled && (
        <div className="ml-auto">
          <IconButton
            key={processButton.key}
            tooltip={processButton.tooltip}
            onClick={processButton.onClick}
            disabled={processButton.disabled}
            className={processButton.className}
            iconText={processButton.iconText}>
            {processButton.icon}
          </IconButton>
        </div>
      )}
    </div>
  );
};

export default ToolbarSection;
