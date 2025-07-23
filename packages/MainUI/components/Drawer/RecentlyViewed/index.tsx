import type { RecentlyViewedProps } from "@workspaceui/componentlibrary/src/components/Drawer/types";
import type { Menu } from "@workspaceui/api-client/src/api/types";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useRecentItems } from "../../../hooks/useRecentItems";
import { useTranslation } from "../../../hooks/useTranslation";
import { useUserContext } from "../../../hooks/useUserContext";
import clsx from "clsx";
import ChevronDown from "../../../../ComponentLibrary/src/assets/icons/chevron-down.svg";
import CustomClickAwayListener from "@workspaceui/componentlibrary/src/utils/clickAway";
import DrawerSection from "@workspaceui/componentlibrary/src/components/Drawer/DrawerSection";
import { CLOCK_B64 } from "@workspaceui/componentlibrary/src/components/Drawer/MenuTitle/constants";

export const RecentlyViewed = forwardRef<{ handleWindowAccess: (item: Menu) => void }, RecentlyViewedProps>(
  ({ onClick, items, getTranslatedName, open, windowId }, ref) => {
    const [expanded, setExpanded] = useState<boolean>(false);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [popperOpen, setPopperOpen] = useState(false);

    const { t } = useTranslation();
    const { currentRole } = useUserContext();
    const popperRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = useCallback(() => {
      if (!open) {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }

        hoverTimeoutRef.current = setTimeout(() => {
          setPopperOpen(true);
        }, 600);
      }
    }, [open]);

    const handlePopperMouseEnter = useCallback(() => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    }, []);

    const handleMouseLeave = useCallback(() => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }

      hoverTimeoutRef.current = setTimeout(() => {
        setPopperOpen(false);
      }, 300);
    }, []);

    const handleClose = useCallback(() => {
      setPopperOpen(false);
    }, []);

    const handlePopperMouseLeave = useCallback(() => {
      hoverTimeoutRef.current = setTimeout(() => {
        setPopperOpen(false);
      }, 100);
    }, []);

    const handleClickAndClose = useCallback(
      (item: Menu) => {
        onClick(item);
      },
      [onClick]
    );

    useEffect(() => {
      return () => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
      };
    }, []);

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
      name: t("Recently Viewed"),
      type: "Folder",
      children: [],
    };
    const toggleExpanded = () => {
      if (open) setExpanded((prev) => !prev);
    };

    return (
      <div className="p-2" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <button
          type="button"
          onClick={toggleExpanded}
          className={`flex items-center transition-colors duration-300 cursor-pointer w-full
            ${open ? "rounded-lg" : "p-2.5 rounded-full"}
             text-xl justify-between p-1 gap-1 hover:[&_img]:filter-[brightness(0)_saturate(100%)_invert(18%)_sepia(40%)_saturate(7101%)_hue-rotate(215deg)_brightness(91%)_contrast(102%)] ${"text-neutral-90 hover:bg-dynamic-contrast-text hover:text-dynamic-main hover:text-neutral-0"}`}>
          <div className={"flex items-center overflow-hidden"}>
            <div className={"w-8 flex justify-center items-center"}>
              <span className="text-base">
                <img
                  alt="img"
                  src={`data:image/svg+xml;base64,${CLOCK_B64}`}
                  className="filter-[brightness(0)_saturate(100%)_invert(9%)_sepia(100%)_saturate(3080%)_hue-rotate(212deg)_brightness(97%)_contrast(101%)] w-5 h-5"
                />
              </span>
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

        {expanded && open && (
          <div className="mt-2 ml-4 flex flex-wrap gap-2 w-full">
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
        {!open && popperOpen && (
          <div
            ref={popperRef}
            className={`
                      fixed bg-neutral-50 z-50 rounded-xl shadow-2xl
                      transition-all duration-1000 ease-out origin-left border border-transparent-neutral-20
                      max-h-[20rem] overflow-y-auto hide-scrollbar
                      ${popperOpen ? "opacity-100 translate-x-1" : "opacity-0 pointer-events-none -translate-x-2"}`}
            style={{
              left: "3.5rem",
              top: popperRef.current ? popperRef.current.getBoundingClientRect().top : "auto",
            }}
            onMouseEnter={handlePopperMouseEnter}
            onMouseLeave={handlePopperMouseLeave}>
            <CustomClickAwayListener onClickAway={handleClose}>
              <div className="p-2 min-w-[240px]">
                <div
                  className="border-b border-transparent-neutral-5 h-14 flex items-center px-4 bg-neutral-50 
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
              </div>
            </CustomClickAwayListener>
          </div>
        )}
      </div>
    );
  }
);

RecentlyViewed.displayName = "RecentlyViewed";
export default RecentlyViewed;
