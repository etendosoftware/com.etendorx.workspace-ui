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

import { type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DropdownPortalProps {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLElement>;
  children: ReactNode;
  minWidth?: number;
  portalRef?: RefObject<HTMLDivElement>;
}

/** Vertical gap between the trigger and the dropdown. */
const GAP = 4;
/** Minimum breathing room kept between the dropdown and the viewport edges. */
const MARGIN = 8;
/** Height used only to decide whether the dropdown flips above the trigger. */
const MAX_DROPDOWN_HEIGHT = 300;

interface TriggerRect {
  triggerTop: number;
  triggerBottom: number;
  left: number;
  width: number;
  spaceBelow: number;
  spaceAbove: number;
}

const EMPTY_RECT: TriggerRect = {
  triggerTop: 0,
  triggerBottom: 0,
  left: 0,
  width: 0,
  spaceBelow: 0,
  spaceAbove: 0,
};

/**
 * DropdownPortal component
 * Renders dropdown content in a portal at the body level with viewport-relative
 * (fixed) positioning. The dropdown is clamped horizontally so it never overflows
 * the right/left edge of the viewport (which would grow the document and produce a
 * spurious horizontal scrollbar), and flips above the trigger when there is not
 * enough room below. Position is recomputed on scroll and resize.
 */
export const DropdownPortal = ({ isOpen, triggerRef, children, minWidth = 256, portalRef }: DropdownPortalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<TriggerRect>(EMPTY_RECT);
  const [showAbove, setShowAbove] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const bounds = trigger.getBoundingClientRect();
      const width = Math.max(bounds.width, minWidth);
      // Clamp so the dropdown stays fully inside the viewport: align to the right
      // edge when there is no room, but never push it off the left edge.
      const clampedLeft = Math.max(MARGIN, Math.min(bounds.left, window.innerWidth - width - MARGIN));

      setRect({
        triggerTop: bounds.top,
        triggerBottom: bounds.bottom,
        left: clampedLeft,
        width,
        spaceBelow: window.innerHeight - bounds.bottom,
        spaceAbove: bounds.top,
      });
    };

    updatePosition();

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, triggerRef, minWidth]);

  // After the content is laid out, measure its height and decide above/below.
  useLayoutEffect(() => {
    if (!isOpen) {
      setIsPositioned(false);
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    const actualHeight = Math.min(container.scrollHeight, MAX_DROPDOWN_HEIGHT);
    const shouldShowAbove = rect.spaceBelow < actualHeight + GAP && rect.spaceAbove > rect.spaceBelow;
    setShowAbove(shouldShowAbove);
    setIsPositioned(true);
  }, [isOpen, rect]);

  if (!isOpen) return null;

  const top = showAbove ? rect.triggerTop - GAP : rect.triggerBottom + GAP;

  const portalContent = (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (portalRef) {
          (portalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      }}
      className="fixed z-[9999] bg-white rounded shadow-lg overflow-hidden border border-transparent-neutral-10"
      style={{
        top: `${top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        transform: showAbove ? "translateY(-100%)" : undefined,
        visibility: isPositioned ? "visible" : "hidden",
      }}>
      {children}
    </div>
  );

  return typeof document !== "undefined" ? createPortal(portalContent, document.body) : null;
};
