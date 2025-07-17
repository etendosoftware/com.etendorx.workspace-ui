import type { ToolbarSectionConfig } from "../types";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import IconButtonWithText from "@workspaceui/componentlibrary/src/components/IconButtonWithText";
import {
  FILLED_BUTTON_TYPE,
  OUTLINED_BUTTON_TYPE,
} from "@workspaceui/componentlibrary/src/components/IconButtonWithText/constants";

const ToolbarSection: React.FC<ToolbarSectionConfig> = ({ buttons, style = {}, className = "", processButton }) => {
  if (!buttons.length) return null;

  return (
    <div style={style} className={className}>
      {buttons.map(({ key, icon, iconText, tooltip, onClick, disabled, className }) => {
        if (iconText) {
          return (
            <IconButtonWithText
              key={key}
              buttonType={FILLED_BUTTON_TYPE}
              leftIcon={icon}
              text={iconText}
              onClick={onClick}
              disabled={disabled}
              customContainerStyles={className}
            />
          );
        }
        return (
          <IconButton
            key={key}
            tooltip={tooltip}
            onClick={onClick}
            disabled={disabled}
            className={className}
            iconText={iconText}>
            {icon}
          </IconButton>
        );
      })}
      {processButton && !processButton.disabled && (
        <div className="ml-auto">
          <IconButtonWithText
            buttonType={OUTLINED_BUTTON_TYPE}
            leftIcon={processButton.leftIcon}
            rightIcon={processButton.rightIcon}
            text={processButton.text}
            onClick={processButton.onClick}
            disabled={processButton.disabled}
            customContainerStyles={processButton.customContainerStyles}
          />
        </div>
      )}
    </div>
  );
};

export default ToolbarSection;
