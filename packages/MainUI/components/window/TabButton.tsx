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

import { useCallback, useMemo } from "react";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import type { TabSwitchProps } from "@/components/window/types";
import { useCurrentWindowIdentifier } from "@/contexts/CurrentWindowContext";
import { useWindowStore } from "@/stores/windowStore";
import { formatDirtyTitle, isTabDirty } from "@/utils/window/dirtyState";
import { getTabCountKey, useTabCountsStore } from "@/stores/tabCountsStore";
import { formatRecordCount } from "@workspaceui/componentlibrary/src/components/Table/RecordCounters/formatRecordCount";

export const TabButton = ({
  tab,
  onClick,
  active,
  onDoubleClick,
  onPrewarm,
  isWindow = false,
  showIcon = false,
  onClose,
  canClose = true,
}: TabSwitchProps) => {
  const { window } = useMetadataContext();
  // Outside a Window subtree the identifier defaults to "", which is never dirty.
  const windowIdentifier = useCurrentWindowIdentifier();
  const isDirty = useWindowStore((s) => isTabDirty(s.dirtyWindows, windowIdentifier, tab.id));
  const tabCountKey = getTabCountKey(windowIdentifier, tab.id);
  const recordCount = useTabCountsStore((s) => s.counts[tabCountKey]);
  const hasMoreRecords = useTabCountsStore((s) => Boolean(s.partial[tabCountKey]));

  const baseTitle = useMemo(() => {
    if (isWindow) {
      return tab.title || tab.name;
    }

    if (tab.tabLevel === 0) {
      return window?.name;
    }

    return tab.name;
  }, [tab.tabLevel, tab.name, tab.title, window?.name, isWindow]);

  /** Marks the tab whose form or grid holds unsaved changes, like Classic's `* ` prefix. */
  const title = useMemo(() => {
    if (!baseTitle) {
      return baseTitle;
    }
    return formatDirtyTitle(baseTitle, isDirty);
  }, [baseTitle, isDirty]);

  const handleClick = useCallback(() => {
    onClick(tab);
  }, [onClick, tab]);

  const handleDoubleClick = useCallback(() => {
    onDoubleClick(tab);
  }, [onDoubleClick, tab]);

  const handlePrewarm = useCallback(() => {
    onPrewarm?.(tab);
  }, [onPrewarm, tab]);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose?.(e);
    },
    [onClose]
  );

  const getWindowButtonClass = () => {
    const baseWindowClass = `
      flex items-center gap-2 px-4 py-2 cursor-pointer min-w-[120px] max-w-[200px]
      transition-colors appearance-none w-full text-left
    `;

    if (active) {
      return `${baseWindowClass} bg-(--color-baseline-0) text-(--color-baseline-30)`;
    }

    return `${baseWindowClass} bg-gray-100 hover:bg-gray-50 text-gray-600`;
  };

  const getTabButtonClass = () => {
    const baseTabClass = `
      px-2 py-1 w-auto min-w-max flex-shrink-0 border-b-2 font-semibold
      transition-colors appearance-none whitespace-nowrap
      hover:text-(--color-neutral-90) hover:border-b-(--color-neutral-90)
    `;

    if (tab.tabLevel === 0) {
      return `${baseTabClass} text-xl mb-2`;
    }

    // Child tabs follow the Design Kit "Solapa": 36px tall, 12px top radius, 2px bottom border when active. The strip stretches them to its full height, so the
    // active underline sits on the strip's bottom edge and cannot be clipped.
    const childClass =
      "group flex h-9 self-end items-center gap-1 px-1 rounded-t-xl w-auto min-w-max flex-shrink-0 border-b-2 text-sm transition-colors appearance-none whitespace-nowrap";
    if (active) {
      return `${childClass} border-(--ui-tab-active-line) font-semibold text-(--ui-text)`;
    }

    return `${childClass} border-transparent font-medium text-(--ui-text-soft) hover:bg-(--ui-hover) hover:text-(--ui-text)`;
  };

  // Extract close button styling logic
  const getCloseButtonClass = () => {
    const baseCloseClass = `
      w-4 h-4 flex-shrink-0 rounded-full flex items-center justify-center
      hover:bg-gray-200 transition-colors
    `;

    if (active) {
      return `${baseCloseClass} opacity-70 hover:opacity-100`;
    }

    return `${baseCloseClass} opacity-50 hover:opacity-70`;
  };

  const baseClass = isWindow ? getWindowButtonClass() : getTabButtonClass();

  if (isWindow) {
    return (
      <div className="flex items-center w-full gap-2">
        <button
          type="button"
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          title={title}
          aria-label={title}
          className={baseClass}>
          {showIcon && <div className="w-4 h-4 flex-shrink-0">🏠</div>}
          <span className="flex-1 truncate text-sm" title={title}>
            {title}
          </span>
        </button>
        {canClose && onClose && (
          <button type="button" className={getCloseButtonClass()} onClick={handleClose} title="Cerrar ventana">
            ✕
          </button>
        )}
      </div>
    );
  }

  if (!title) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onPointerEnter={handlePrewarm}
      onFocus={handlePrewarm}
      title={title}
      aria-label={title}
      className={baseClass}>
      {tab.tabLevel > 0 ? (
        <ChildTabLabel
          tabId={tab.id}
          title={title}
          count={recordCount}
          hasMoreRecords={hasMoreRecords}
          active={active}
          data-testid="ChildTabLabel__48772b"
        />
      ) : (
        title
      )}
    </button>
  );
};

/**
 * Label of a child tab: its title and its record count. The tab always keeps room for the count, so the tab strip
 * never moves. While the count is hidden the title is centered in the tab; on hover, on keyboard focus and on the
 * active tab it slides to the side and the count appears (ETP-6431).
 */
export const CHILD_TAB_LABEL_CLASSES = "relative inline-flex items-center pr-12";
const TITLE_CENTERED_CLASSES = "translate-x-6";
const TITLE_SLIDE_CLASSES =
  "transition-transform duration-150 motion-reduce:transition-none group-hover:translate-x-0 group-focus-visible:translate-x-0";
export const TAB_COUNT_BADGE_CLASSES =
  "absolute right-0 top-1/2 -translate-y-1/2 flex h-5 min-w-6 items-center justify-center rounded-full bg-(--ui-hover) px-2 text-[11px] font-medium leading-4 tabular-nums text-(--ui-text-soft)";
const BADGE_REVEAL_CLASSES =
  "opacity-0 transition-opacity duration-150 motion-reduce:transition-none group-hover:opacity-100 group-focus-visible:opacity-100";

interface ChildTabLabelProps {
  tabId: string;
  title: string;
  /** Records of the tab; undefined while it is unknown (tab not loaded yet, loading, or several parents selected). */
  count?: number;
  hasMoreRecords: boolean;
  active: boolean;
}

/** Classes of the title and the count: shown on the active tab, revealed on hover and focus otherwise. */
export function getChildTabLabelClasses(hasCount: boolean, active: boolean): { title: string; badge: string } {
  if (!hasCount) {
    return { title: TITLE_CENTERED_CLASSES, badge: "" };
  }
  if (active) {
    return { title: "", badge: TAB_COUNT_BADGE_CLASSES };
  }
  return {
    title: `${TITLE_CENTERED_CLASSES} ${TITLE_SLIDE_CLASSES}`,
    badge: `${TAB_COUNT_BADGE_CLASSES} ${BADGE_REVEAL_CLASSES}`,
  };
}

const ChildTabLabel = ({ tabId, title, count, hasMoreRecords, active }: ChildTabLabelProps) => {
  const classes = getChildTabLabelClasses(count !== undefined, active);

  return (
    <span className={CHILD_TAB_LABEL_CLASSES}>
      <span className={classes.title}>{title}</span>
      {count !== undefined && (
        <span className={classes.badge} data-testid={`TabButton__count_${tabId}`}>
          {formatRecordCount(count, hasMoreRecords)}
        </span>
      )}
    </span>
  );
};

export default TabButton;
