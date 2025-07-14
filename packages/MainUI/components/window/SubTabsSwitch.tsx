"use client";

import type { TabsSwitchProps } from "@/components/window/types";
import { TabButton } from "@/components/window/TabButton";
import { IconButton } from "@workspaceui/componentlibrary/src/components";
import ChevronDown from "../../../ComponentLibrary/src/assets/icons/chevron-down.svg";

export const SubTabsSwitch = ({ tabs, current, onClick, onClose, onDoubleClick, collapsed }: TabsSwitchProps) => {
  return (
    <div
      onDoubleClick={() => {
        collapsed ? onClick(current) : onClose();
      }}
      className="flex items-center justify-between px-2 py-2 bg-(--color-transparent-neutral-5) max-h-[2.75rem]">
      <div>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            onClick={onClick}
            active={current.id === tab.id}
            onDoubleClick={onDoubleClick}
          />
        ))}
      </div>
      <IconButton className="bg-transparent">
        <ChevronDown
          onClick={collapsed ? () => onClick(current) : onClose}
          className={`transition-transform duration-300 ease-in-out ${collapsed ? "rotate-180" : "rotate-0"}`}
        />
      </IconButton>
    </div>
  );
};

export default SubTabsSwitch;
