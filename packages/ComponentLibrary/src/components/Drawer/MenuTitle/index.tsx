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
import React, { useCallback } from "react";
import ChevronDown from "../../../assets/icons/chevron-down.svg";
import type { MenuTitleProps } from "../types";
import { DEFAULT_B64, PROCESS_B64, REPORT_B64, SUMMARY_B64 } from "./constants";
import { useFavoritesDrawer } from "../FavoritesDrawerContext";

function getIconSrc(item: { icon?: string | null; type?: string }): string {
  if (item.icon) return `data:image/svg+xml;base64,${item.icon}`;
  switch (item.type) {
    case "Report":
      return `data:image/svg+xml;base64,${REPORT_B64}`;
    case "ProcessDefinition":
    case "ProcessManual":
      return `data:image/svg+xml;base64,${PROCESS_B64}`;
    case "Summary":
      return `data:image/svg+xml;base64,${SUMMARY_B64}`;
    default:
      return `data:image/svg+xml;base64,${DEFAULT_B64}`;
  }
}

function getMenuButtonClassName(open?: boolean, selected?: boolean, isParentActive?: boolean): string {
  const parts: string[] = ["relative flex items-center transition-colors duration-300 cursor-pointer"];

  if (open) {
    parts.push(
      "hover:[&_img]:filter-[brightness(0)_saturate(100%)_invert(18%)_sepia(40%)_saturate(7101%)_hue-rotate(215deg)_brightness(91%)_contrast(102%)]"
    );
  }

  if (selected) {
    parts.push(
      "hover:bg-dynamic-main",
      "text-white",
      "hover:[&_img]:filter-[brightness(0)_saturate(100%)_invert(100%)_sepia(45%)_saturate(0%)_hue-rotate(45deg)_brightness(113%)_contrast(100%)]"
    );
  } else {
    parts.push("hover:bg-dynamic-contrast-text");
  }

  if (isParentActive && open) {
    parts.push(
      "[&_img]:filter-[brightness(0)_saturate(100%)_invert(18%)_sepia(40%)_saturate(7101%)_hue-rotate(215deg)_brightness(91%)_contrast(102%)]",
      "text-dynamic-main"
    );
  }

  if (open) {
    if (selected) {
      parts.push(
        "rounded-lg text-xl justify-between p-1",
        "bg-dynamic-main text-white [&_img]:filter-[brightness(0)_saturate(100%)_invert(100%)_sepia(45%)_saturate(0%)_hue-rotate(45deg)_brightness(113%)_contrast(100%)]",
        "w-full"
      );
    } else {
      parts.push("rounded-lg text-xl justify-between p-1 text-baseline-80 hover:text-dynamic-main w-full");
    }
  } else {
    parts.push(
      "p-2.5 rounded-full hover:bg-dynamic-main hover:[&_img]:filter-[brightness(0)_saturate(100%)_invert(100%)_sepia(45%)_saturate(0%)_hue-rotate(45deg)_brightness(113%)_contrast(100%)]"
    );
    if (isParentActive) {
      parts.push(
        "bg-dynamic-main [&_img]:filter-[brightness(0)_saturate(100%)_invert(100%)_sepia(45%)_saturate(0%)_hue-rotate(45deg)_brightness(113%)_contrast(100%)]"
      );
    }
  }

  return parts.join(" ");
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const MenuTitle: React.FC<MenuTitleProps> = React.memo(
  ({ item, onClick, selected, expanded, open, popperOpen, isParentActive }) => {
    const favoritesCtx = useFavoritesDrawer();
    const isFav = favoritesCtx && item.windowId ? favoritesCtx.isFavorite(item.windowId) : false;

    const handleFavoriteClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        favoritesCtx?.toggle(item);
      },
      [favoritesCtx, item]
    );

    return (
      <button
        data-testid={`MenuTitle__${item.id ?? (item.name ? item.name.replace(/\s+/g, "-").toLowerCase() : "menu-title")}`}
        type="button"
        onClick={onClick}
        className={getMenuButtonClassName(open, selected, isParentActive)}>
        <div className={`flex items-center ${open ? "overflow-hidden" : ""}`}>
          <div className={`${open ? "w-8" : "w-full h-full"} flex justify-center items-center`}>
            {item.icon ? (
              <img
                alt="img"
                src={`data:image/svg+xml;base64,${item.icon}`}
                className="filter-[brightness(0)_saturate(100%)_invert(9%)_sepia(100%)_saturate(3080%)_hue-rotate(212deg)_brightness(97%)_contrast(101%)] w-5 h-5"
              />
            ) : (
              <span className="text-base">
                <img
                  alt={item.type || "icon"}
                  src={getIconSrc(item)}
                  className="filter-[brightness(0)_saturate(100%)_invert(9%)_sepia(100%)_saturate(3080%)_hue-rotate(212deg)_brightness(97%)_contrast(101%)] w-5 h-5"
                />
              </span>
            )}
          </div>
          {open && (
            <div className="relative group flex items-center py-1.5 flex-1 min-w-0">
              <span className="ml-2 font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0">
                {item.name}
              </span>
              {favoritesCtx && item.windowId && (
                <button
                  type="button"
                  onClick={handleFavoriteClick}
                  className={`shrink-0 ml-1 p-0.5 rounded transition-all ${
                    isFav
                      ? "text-yellow-400 opacity-100"
                      : "text-baseline-40 opacity-0 group-hover:opacity-100 hover:text-yellow-400"
                  }`}
                  title={isFav ? "Remove from favorites" : "Add to favorites"}>
                  <StarIcon filled={isFav} />
                </button>
              )}
            </div>
          )}
        </div>
        {open && item.children && !popperOpen && (
          <div className={`transition-transform duration-300 flex justify-center ${expanded ? "rotate-180" : ""}`}>
            <ChevronDown />
          </div>
        )}
      </button>
    );
  }
);

MenuTitle.displayName = "MenuTitle";
export default MenuTitle;
