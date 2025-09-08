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
import React from "react";
import ChevronDown from "../../../assets/icons/chevron-down.svg";
import type { MenuTitleProps } from "../types";
import { DEFAULT_B64, PROCESS_B64, REPORT_B64, SUMMARY_B64 } from "./constants";

export const MenuTitle: React.FC<MenuTitleProps> = React.memo(
  ({ item, onClick, selected, expanded, open, popperOpen, isParentActive }) => {
    const getIconSrc = () => {
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
    };

    return (
      <button
        data-testid={`MenuTitle__${item.id ?? (item.name ? item.name.replace(/\s+/g, "-").toLowerCase() : "menu-title")}`}
        type="button"
        onClick={onClick}
        className={`${open && "hover:[&_img]:filter-[brightness(0)_saturate(100%)_invert(18%)_sepia(40%)_saturate(7101%)_hue-rotate(215deg)_brightness(91%)_contrast(102%)]"}
 relative flex items-center transition-colors duration-300 cursor-pointer hover:${selected ? "bg-dynamic-main text-white hover:[&_img]:filter-[brightness(0)_saturate(100%)_invert(100%)_sepia(45%)_saturate(0%)_hue-rotate(45deg)_brightness(113%)_contrast(100%)]" : "bg-dynamic-contrast-text"} ${isParentActive && open && "[&_img]:filter-[brightness(0)_saturate(100%)_invert(18%)_sepia(40%)_saturate(7101%)_hue-rotate(215deg)_brightness(91%)_contrast(102%)] text-dynamic-main"}  ${
   open
     ? `rounded-lg text-xl justify-between p-1 ${
         selected
           ? "bg-dynamic-main text-white [&_img]:filter-[brightness(0)_saturate(100%)_invert(100%)_sepia(45%)_saturate(0%)_hue-rotate(45deg)_brightness(113%)_contrast(100%)]"
           : "text-baseline-80 hover:text-dynamic-main"
       } w-full`
     : `p-2.5 rounded-full hover:bg-dynamic-main hover:[&_img]:filter-[brightness(0)_saturate(100%)_invert(100%)_sepia(45%)_saturate(0%)_hue-rotate(45deg)_brightness(113%)_contrast(100%)] "  ${
         isParentActive &&
         "bg-dynamic-main [&_img]:filter-[brightness(0)_saturate(100%)_invert(100%)_sepia(45%)_saturate(0%)_hue-rotate(45deg)_brightness(113%)_contrast(100%)]"
       }`
 }`}>
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
                  src={getIconSrc()}
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
