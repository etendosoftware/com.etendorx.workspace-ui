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

import { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { computeTooltipPlacement, TOOLTIP_MARGIN, type TooltipPlacement, type TooltipPosition } from "./placement";

const SHOW_DELAY = 600;
/** Wider titles wrap instead of leaving the screen. */
const TOOLTIP_MAX_WIDTH = `calc(100vw - ${TOOLTIP_MARGIN * 2}px)`;

export interface TooltipProps {
  title?: string;
  children: React.ReactNode;
  position?: TooltipPosition;
  containerClassName?: string;
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ title, children, position = "bottom", containerClassName, disabled }) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<TooltipPlacement | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!visible || !wrapperRef.current || !tooltipRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };

    setCoords(computeTooltipPlacement(position, wrapperRef.current.getBoundingClientRect(), tooltipRect, viewport));
  }, [visible, position]);

  useEffect(() => {
    return () => {
      if (showTimer.current) {
        clearTimeout(showTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      hideTooltip();
    }
  }, [disabled]);

  const showTooltip = () => {
    if (disabled) return;
    if (showTimer.current) clearTimeout(showTimer.current);
    showTimer.current = window.setTimeout(() => {
      setVisible(true);
    }, SHOW_DELAY);
  };

  const hideTooltip = () => {
    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    setVisible(false);
  };

  const getArrowStyles = () => {
    const base = "absolute w-2 h-2 rotate-45 bg-gray-900 dark:bg-[#ececf1]";

    switch (position) {
      case "top":
        return `${base} bottom-[-4px] -translate-x-1/2`;
      case "bottom":
        return `${base} top-[-4px] -translate-x-1/2`;
      case "left":
        return `${base} right-[-4px] -translate-y-1/2`;
      case "right":
        return `${base} left-[-4px] -translate-y-1/2`;
    }
  };

  const getArrowOffsetStyle = (): React.CSSProperties => {
    if (position === "top" || position === "bottom") return { left: coords?.arrowOffset };
    return { top: coords?.arrowOffset };
  };

  if (!title) return <>{children}</>;

  return (
    <div
      ref={wrapperRef}
      className={`relative group ${containerClassName ?? ""}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}>
      {children}
      {visible &&
        ReactDOM.createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            style={{
              top: coords?.top,
              left: coords?.left,
              maxWidth: TOOLTIP_MAX_WIDTH,
              visibility: coords?.top != null && coords?.left != null ? "visible" : "hidden",
            }}
            className="fixed z-[1000] w-max opacity-100 transition-opacity duration-100 pointer-events-none">
            <div className="relative">
              <div className={getArrowStyles()} style={getArrowOffsetStyle()} />
              <div className="bg-gray-900 text-white dark:bg-[#ececf1] dark:text-[#16171b] text-sm rounded px-2 py-1 shadow-md break-words">
                {title}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Tooltip;
