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

// @data-testid-ignore
import type { ToolbarSectionConfig } from "../types";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import IconButtonWithText from "@workspaceui/componentlibrary/src/components/IconButtonWithText";
import {
  FILLED_BUTTON_TYPE,
  OUTLINED_BUTTON_TYPE,
} from "@workspaceui/componentlibrary/src/components/IconButtonWithText/constants";
import { Badge } from "@mui/material";

const ToolbarSection: React.FC<ToolbarSectionConfig> = ({ buttons, style = {}, className = "", processButton }) => {
  if (!buttons.length) return null;

  return (
    <div style={style} className={className}>
      {buttons.map(({ key, icon, iconText, tooltip, onClick, disabled, className, badgeContent }) => {
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
              data-testid={`IconButtonWithText__${key ?? "2bded0"}`}
            />
          );
        }

        const iconButton = (
          <IconButton
            key={key}
            tooltip={tooltip}
            onClick={onClick}
            disabled={disabled}
            className={className}
            iconText={iconText}
            data-testid={`IconButton__${key ?? "2bded0"}`}>
            {icon}
          </IconButton>
        );

        if (badgeContent !== undefined && badgeContent !== null && badgeContent !== 0 && badgeContent !== "") {
          return (
            <Badge
              key={key}
              badgeContent={badgeContent}
              color="error"
              sx={{
                "& .MuiBadge-badge": {
                  fontSize: "0.625rem",
                  height: "16px",
                  minWidth: "16px",
                  padding: "0 4px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  top: "6px",
                  right: "6px",
                },
              }}>
              {iconButton}
            </Badge>
          );
        }

        return iconButton;
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
            data-testid={`IconButtonWithText__${processButton.key ?? processButton.text?.replace(/\s+/g, "-").toLowerCase() ?? "2bded0"}`}
          />
        </div>
      )}
    </div>
  );
};

export default ToolbarSection;
