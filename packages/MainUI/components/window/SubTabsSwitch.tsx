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
"use client";

import type { TabsSwitchProps } from "@/components/window/types";
import { TabButton } from "@/components/window/TabButton";
import { IconButton } from "@workspaceui/componentlibrary/src/components";
import ChevronDown from "../../../ComponentLibrary/src/assets/icons/chevron-down.svg";

export const SubTabsSwitch = ({
  tabs,
  current,
  activeTabId,
  onClick,
  onClose,
  onDoubleClick,
  collapsed,
}: TabsSwitchProps) => {
  return (
    <div
      onDoubleClick={() => {
        collapsed ? onClick(current) : onClose();
      }}
      className="flex items-center justify-between px-2 py-2 bg-(--color-transparent-neutral-5) max-h-[2.75rem]">
      <div
        className="flex overflow-x-auto flex-nowrap scroll-smooth"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(0, 0, 0, 0.3) transparent",
          WebkitOverflowScrolling: "touch",
        }}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            onClick={onClick}
            active={(activeTabId ?? current.id) === tab.id}
            onDoubleClick={onDoubleClick}
            data-testid={`TabButton__${tab.id ?? "a89627"}`}
          />
        ))}
      </div>
      <IconButton className="bg-transparent" data-testid={`IconButton__${current?.id ?? activeTabId ?? "a89627"}`}>
        <ChevronDown
          onClick={collapsed ? () => onClick(current) : onClose}
          className={`transition-transform duration-300 ease-in-out ${collapsed ? "rotate-180" : "rotate-0"}`}
          data-testid={`ChevronDown__${current?.id ?? activeTabId ?? "a89627"}`}
        />
      </IconButton>
    </div>
  );
};

export default SubTabsSwitch;
