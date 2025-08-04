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

import type { RecentlyViewedProps } from "@workspaceui/componentlibrary/src/components/Drawer/types";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { useRecentItems } from "../../../hooks/useRecentItems";
import { useTranslation } from "../../../hooks/useTranslation";
import { useUserContext } from "../../../hooks/useUserContext";
import clsx from "clsx";
import ChevronDown from "../../../../ComponentLibrary/src/assets/icons/chevron-down.svg";
import DrawerSection from "@workspaceui/componentlibrary/src/components/Drawer/DrawerSection";
import { CLOCK_B64 } from "@workspaceui/componentlibrary/src/components/Drawer/MenuTitle/constants";
import MenuLibrary from "../../../../ComponentLibrary/src/components/Menu";

export const RecentlyViewed = forwardRef<{ handleWindowAccess: (item: Menu) => void }, RecentlyViewedProps>(
  ({ onClick, items, getTranslatedName, open, windowId }, ref) => {
    const [expanded, setExpanded] = useState<boolean>(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const { t } = useTranslation();
    const { currentRole } = useUserContext();

    const handleCloseMenu = useCallback(() => {
      setAnchorEl(null);
    }, []);

    const handleClickAndClose = useCallback(
      (item: Menu) => {
        onClick(item);
        handleCloseMenu();
      },
      [handleCloseMenu, onClick]
    );

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        if (!open) {
          return setAnchorEl(event.currentTarget);
        }
        setExpanded((prev) => !prev);
      },
      [open]
    );

    const { localRecentItems, handleRecentItemClick, addRecentItem, updateTranslations } = useRecentItems(
      items,
      onClick,
      currentRole?.id ?? "",
      getTranslatedName
    );

    useEffect(() => {
      if (currentRole?.id && items.length > 0) {
        updateTranslations(items);
      }
    }, [items, currentRole?.id, updateTranslations]);

    const handleWindowAccess = useCallback(
      (item: Menu) => {
        if (item.id && item.type) {
          addRecentItem(item);
        }
      },
      [addRecentItem]
    );

    useImperativeHandle(
      ref,
      () => ({
        handleWindowAccess,
      }),
      [handleWindowAccess]
    );

    if (!currentRole?.id || localRecentItems.length === 0) return null;

    const item = {
      id: "recently-viewed",
      name: t("drawer.recentlyViewed"),
      type: "Folder",
      children: [],
    };

    return (
      <div className="p-2">
        <button
          type="button"
          onClick={handleClick}
          className={`flex transition-colors duration-300 cursor-pointer w-full items-center
            ${open ? "rounded-lg" : "p-2.5 rounded-full justify-center"}
             text-xl justify-between p-1 gap-1 hover:[&_img]:filter-[brightness(0)_saturate(100%)_invert(18%)_sepia(40%)_saturate(7101%)_hue-rotate(215deg)_brightness(91%)_contrast(102%)] ${"text-neutral-90 hover:bg-dynamic-contrast-text hover:text-dynamic-main hover:text-neutral-0"}`}>
          <div className={`flex items-center ${open ? "overflow-hidden" : ""}`}>
            <div className={`${open ? "w-8" : "w-full h-full"} flex justify-center items-center`}>
              <img
                alt="img"
                src={`data:image/svg+xml;base64,${CLOCK_B64}`}
                className="filter-[brightness(0)_saturate(100%)_invert(9%)_sepia(100%)_saturate(3080%)_hue-rotate(212deg)_brightness(97%)_contrast(101%)] w-5 h-5"
              />
            </div>
            {open && (
              <div className="relative group flex items-center py-1.5">
                <span className="ml-2 font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-40">
                  {item.name}
                </span>
              </div>
            )}
          </div>

          {open && item.children && (
            <div className={`transition-transform duration-300 flex justify-center ${expanded ? "rotate-180" : ""}`}>
              <ChevronDown />
            </div>
          )}
        </button>

        {expanded && open && (
          <div className="pt-2 pl-4 flex flex-wrap gap-2 w-full">
            {localRecentItems.map((recentItem) => (
              <button
                key={recentItem.id}
                type="button"
                onClick={() => handleRecentItemClick(recentItem)}
                className={clsx(
                  "rounded-full px-4 py-1 text-sm font-medium border",
                  "bg-[#00030D0D] text-gray-800 border-gray-300 hover:bg-gray-200 transition"
                )}>
                {recentItem.name}
              </button>
            ))}
          </div>
        )}
        {!open && (
          <MenuLibrary
            className="max-h-80 w-full max-w-60  overflow-y-scroll overflow-hidden hide-scrollbar"
            anchorEl={anchorEl}
            offsetX={52}
            offsetY={-40}
            onClose={handleCloseMenu}>
            <div
              className="border-b border-transparent-neutral-5 h-13 flex items-center px-6 bg-neutral-50 
                font-inter font-semibold text-[14px] leading-[20px] tracking-[0.15px] text-baseline-80">
              {item.name}
            </div>
            {localRecentItems?.map((subitem) => (
              <DrawerSection
                key={subitem.id}
                item={subitem}
                onClick={handleClickAndClose}
                open={true}
                isSearchActive={false}
                onToggleExpand={() => {}}
                hasChildren={false}
                isExpandable={false}
                isExpanded={false}
                parentId={subitem.id}
                windowId={windowId}
              />
            ))}
          </MenuLibrary>
        )}
      </div>
    );
  }
);

RecentlyViewed.displayName = "RecentlyViewed";
export default RecentlyViewed;
