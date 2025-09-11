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

"use client";
import CheckIcon from "@workspaceui/componentlibrary/src/assets/icons/check.svg";
import { useState } from "react";
import FolderIcon from "@workspaceui/componentlibrary/src/assets/icons/folder.svg";
import Tooltip from "@workspaceui/componentlibrary/src/components/Tooltip";

interface MenuItemProps {
  windowId: string;
  title: string;
  isActive: boolean;
  onSelect: (windowId: string) => void;
}

export default function MenuItem({ windowId, title, isActive, onSelect }: MenuItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const showSelected = isActive || isHovered;

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <Tooltip title={title} position="left" containerClassName="w-full" data-testid="Tooltip__6d20d3">
      <button
        type="button"
        key={windowId}
        className={`w-full h-9 flex items-center justify-between rounded-lg p-2 ${showSelected ? "bg-[var(--color-dynamic-light)]" : ""}`}
        onClick={() => onSelect(windowId)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        <div
          className={`flex items-center gap-2 overflow-hidden w-10/12 text-[var(--color-baseline-90)] ${showSelected ? "text-[var(--color-dynamic-main)]" : ""}`}>
          <div className="truncate flex items-center gap-2">
            <FolderIcon
              className={`min-h-4 min-w-4 h-4 w-4 fill-[var(--color-baseline-60)] hover:fill-[var(--color-dynamic-main)] ${showSelected ? "fill-[var(--color-dynamic-main)]" : ""}`}
              data-testid="FolderIcon__6d20d3"
            />
            <span className="truncate">{title}</span>
          </div>
        </div>
        {isActive && (
          <CheckIcon
            className="min-h-4 min-w-4 h-4 w-4 fill-[var(--color-dynamic-main)]"
            data-testid="CheckIcon__6d20d3"
          />
        )}
      </button>
    </Tooltip>
  );
}
