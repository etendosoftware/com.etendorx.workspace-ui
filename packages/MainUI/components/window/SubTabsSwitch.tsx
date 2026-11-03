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

import { useCallback, useEffect, useRef, useState } from "react";
import type { TabsSwitchProps } from "@/components/window/types";
import { TabButton } from "@/components/window/TabButton";
import { useTranslation } from "@/hooks/useTranslation";
import { IconButton } from "@workspaceui/componentlibrary/src/components";
import ChevronDown from "../../../ComponentLibrary/src/assets/icons/chevron-down.svg";

/** Width of the fade that hints there are more tabs on that side. */
const EDGE_FADE_PX = 28;
/** Least a press of an arrow moves the strip. */
const MIN_SCROLL_PX = 120;

/**
 * Tells whether the strip has tabs hidden on either side, and lets the mouse wheel scroll it sideways. The native
 * scrollbar of the strip is hidden, so the fades are what says "there is more", and the wheel is how a mouse reaches it.
 */
function useStripOverflow(tabCount: number) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const left = strip.scrollLeft > 1;
    const right = strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1;
    setOverflow((previous) => (previous.left === left && previous.right === right ? previous : { left, right }));
  }, []);

  // tabCount: a different number of tabs changes what overflows
  // biome-ignore lint/correctness/useExhaustiveDependencies: measured again when the tabs change
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    measure();
    strip.addEventListener("scroll", measure, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(strip);

    // Not a React handler: React registers wheel listeners as passive, and this one has to cancel the page scroll
    const onWheel = (event: WheelEvent) => {
      const canScroll = strip.scrollWidth > strip.clientWidth;
      if (!canScroll || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      strip.scrollLeft += event.deltaY;
      event.preventDefault();
    };
    strip.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      strip.removeEventListener("scroll", measure);
      strip.removeEventListener("wheel", onWheel);
      observer?.disconnect();
    };
  }, [measure, tabCount]);

  /** Moves the strip about a page of tabs in one direction. */
  const scrollPage = useCallback((direction: -1 | 1) => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy?.({ left: direction * Math.max(MIN_SCROLL_PX, strip.clientWidth * 0.6), behavior: "smooth" });
  }, []);

  return { stripRef, overflow, scrollPage };
}

interface ScrollArrowProps {
  direction: "back" | "forward";
  label: string;
  /** Whether there are tabs left to reveal on that side. */
  enabled: boolean;
  onPress: () => void;
}

/** Button of the arrow group next to the strip's collapse button; the one with nothing left to reveal is dimmed. */
const ScrollArrow = ({ direction, label, enabled, onPress }: ScrollArrowProps) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onPress}
    disabled={!enabled}
    // The strip toggles its panel on a double click: pressing the arrows quickly must not
    onDoubleClick={(event) => event.stopPropagation()}
    data-testid={`SubTabsSwitch__scroll_${direction}`}
    className={`flex h-6 w-6 items-center justify-center rounded-full bg-(--ui-nav-btn-bg) text-(--ui-text-soft) shadow-sm transition-colors ${enabled ? "cursor-pointer hover:bg-(--color-dynamic-main) hover:text-(--color-baseline-0)" : "cursor-default opacity-40"}`}>
    <ChevronDown className={`h-4 w-4 ${direction === "back" ? "rotate-90" : "-rotate-90"}`} />
  </button>
);

export const SubTabsSwitch = ({
  tabs,
  current,
  activeTabId,
  onClick,
  onDoubleClick,
  onPrewarm,
  collapsed,
  isExpanded,
}: TabsSwitchProps) => {
  const { t } = useTranslation();
  const { stripRef, overflow, scrollPage } = useStripOverflow(tabs.length);
  const canScroll = overflow.left || overflow.right;
  const fadeMask = canScroll
    ? `linear-gradient(to right, transparent 0, #000 ${overflow.left ? EDGE_FADE_PX : 0}px, #000 calc(100% - ${overflow.right ? EDGE_FADE_PX : 0}px), transparent 100%)`
    : undefined;

  return (
    <div
      onDoubleClick={() => {
        onDoubleClick(current);
      }}
      className="flex h-10 items-stretch justify-between px-3 bg-(--ui-child-strip)">
      <div className="flex min-w-0 flex-1 items-stretch">
        <div
          ref={stripRef}
          className="flex items-stretch gap-5 overflow-x-auto flex-nowrap scroll-smooth hide-scrollbar"
          data-testid="SubTabsSwitch__strip"
          style={{ WebkitOverflowScrolling: "touch", maskImage: fadeMask, WebkitMaskImage: fadeMask }}>
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              onClick={onClick}
              active={(activeTabId ?? current.id) === tab.id}
              onDoubleClick={onDoubleClick}
              onPrewarm={onPrewarm}
              data-testid={`TabButton__${tab.id ?? "a89627"}`}
            />
          ))}
        </div>
      </div>
      {canScroll && (
        <div className="flex shrink-0 items-center gap-1 pl-2 pr-1">
          <ScrollArrow
            direction="back"
            label={t("common.scrollTabsBack")}
            enabled={overflow.left}
            onPress={() => scrollPage(-1)}
          />
          <ScrollArrow
            direction="forward"
            label={t("common.scrollTabsForward")}
            enabled={overflow.right}
            onPress={() => scrollPage(1)}
          />
        </div>
      )}
      <IconButton
        className="self-center bg-transparent"
        data-testid={`IconButton__${current?.id ?? activeTabId ?? "a89627"}`}>
        <ChevronDown
          onClick={() => {
            if (collapsed) {
              onClick(current);
            } else {
              onDoubleClick(current);
            }
          }}
          className={`transition-transform duration-300 ease-in-out ${!isExpanded ? "rotate-180" : "rotate-0"}`}
          data-testid={`ChevronDown__${current?.id ?? activeTabId ?? "a89627"}`}
        />
      </IconButton>
    </div>
  );
};

export default SubTabsSwitch;
