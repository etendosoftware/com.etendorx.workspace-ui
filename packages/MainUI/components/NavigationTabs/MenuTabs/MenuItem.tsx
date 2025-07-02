"use client";
import CheckIcon from "@workspaceui/componentlibrary/src/assets/icons/check.svg";
import { useState } from "react";

interface MenuItemProps {
  windowId: string;
  title: string;
  isActive: boolean;
  onSelect: (windowId: string) => void;
}

export default function MenuItem({
  windowId,
  title,
  isActive,
  onSelect,
}: MenuItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const showSelected = isActive || isHovered;

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <button
      type="button"
      key={windowId}
      className={`flex items-center justify-between rounded-lg p-2 ${showSelected ? "bg-[#E5EFFF]" : ""}`}
      onClick={() => onSelect(windowId)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`flex items-center gap-2 ${showSelected ? "text-[#004ACA]" : ""}`}
      >
        {showSelected ? "📂" : "📁"}
        {title}
      </div>
      {isActive && <CheckIcon fill="#004ACA" />}
    </button>
  );
}
