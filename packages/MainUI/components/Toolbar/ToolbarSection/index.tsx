/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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
        <div className="h-full flex items-center">
          <div className="h-5 w-0.5 bg-[var(--color-transparent-neutral-20)] mx-0.5" />
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
