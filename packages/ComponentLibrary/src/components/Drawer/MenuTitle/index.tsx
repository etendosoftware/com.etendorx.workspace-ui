"use client";
import React from "react";
import ChevronDown from "../../../assets/icons/chevron-down.svg";
import type { MenuTitleProps } from "../types";
import { PROCESS_B64, REPORT_B64, SUMMARY_B64 } from "./constants";

export const MenuTitle: React.FC<MenuTitleProps> = React.memo(
  ({ item, onClick, selected, expanded, open, popperOpen, isParentActive }) => {
    return (
      <button
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
                {item.type === "Report" ? (
                  <img
                    alt="report"
                    src={`data:image/svg+xml;base64,${REPORT_B64}`}
                    className="filter-[brightness(0)_saturate(100%)_invert(9%)_sepia(100%)_saturate(3080%)_hue-rotate(212deg)_brightness(97%)_contrast(101%)] w-5 h-5"
                  />
                ) : item.type === "ProcessDefinition" || item.type === "ProcessManual" ? (
                  <img
                    alt="setting"
                    src={`data:image/svg+xml;base64, ${PROCESS_B64}`}
                    className="filter-[brightness(0)_saturate(100%)_invert(9%)_sepia(100%)_saturate(3080%)_hue-rotate(212deg)_brightness(97%)_contrast(101%)] w-5 h-5"
                  />
                ) : item.type === "Summary" ? (
                  <img
                    alt="summary"
                    src={`data:image/svg+xml;base64, ${SUMMARY_B64}`}
                    className="filter-[brightness(0)_saturate(100%)_invert(9%)_sepia(100%)_saturate(3080%)_hue-rotate(212deg)_brightness(97%)_contrast(101%)] w-5 h-5"
                  />
                ) : (
                  <img
                    alt="img"
                    src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik01IDRDNC40NDc3MiA0IDQgNC40NDc3MiA0IDVWOEgyMFY1QzIwIDQuNDQ3NzEgMTkuNTUyMyA0IDE5IDRINVpNMjIgNUMyMiAzLjM0MzE1IDIwLjY1NjkgMiAxOSAySDVDMy4zNDMxNSAyIDIgMy4zNDMxNSAyIDVWMTlDMiAyMC42NTY5IDMuMzQzMTUgMjIgNSAyMkgxOUMyMC42NTY5IDIyIDIyIDIwLjY1NjkgMjIgMTlWNVpNMjAgMTBIMTBWMjBIMTlDMTkuNTUyMyAyMCAyMCAxOS41NTIzIDIwIDE5VjEwWk04IDIwVjEwSDRWMTlDNCAxOS41NTIzIDQuNDQ3NzEgMjAgNSAyMEg4WiIgZmlsbD0iIzAwMDMwRCIvPgo8L3N2Zz4K"
                    className="filter-[brightness(0)_saturate(100%)_invert(9%)_sepia(100%)_saturate(3080%)_hue-rotate(212deg)_brightness(97%)_contrast(101%)] w-5 h-5"
                  />
                )}
              </span>
            )}
          </div>
          {open && (
            <div className="relative group flex items-center py-1.5">
              <span className="ml-2 font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-40">
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
