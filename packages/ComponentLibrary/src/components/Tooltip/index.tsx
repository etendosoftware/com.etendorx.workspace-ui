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

const DEFAULT_MARGIN = 8;
const SHOW_DELAY = 600;

export interface TooltipProps {
  title?: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  containerClassName?: string;
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ title, children, position = "bottom", containerClassName, disabled }) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!visible || !wrapperRef.current || !tooltipRef.current) return;

    const triggerRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top: number | null = null;
    let left: number | null = null;

    switch (position) {
      case "top":
        top = triggerRect.top - tooltipRect.height - DEFAULT_MARGIN;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + DEFAULT_MARGIN;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case "left":
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - DEFAULT_MARGIN;
        break;
      case "right":
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + DEFAULT_MARGIN;
        break;
    }

    setCoords({ top, left });
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
    const base = "absolute w-2 h-2 rotate-45 bg-gray-900";

    switch (position) {
      case "top":
        return `${base} bottom-[-4px] left-1/2 -translate-x-1/2`;
      case "bottom":
        return `${base} top-[-4px] left-1/2 -translate-x-1/2`;
      case "left":
        return `${base} right-[-4px] top-1/2 -translate-y-1/2`;
      case "right":
        return `${base} left-[-4px] top-1/2 -translate-y-1/2`;
    }
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
              visibility: coords?.top != null && coords?.left != null ? "visible" : "hidden",
            }}
            className="fixed z-[1000] opacity-100 transition-opacity duration-100 pointer-events-none">
            <div className="relative">
              <div className={getArrowStyles()} />
              <div className="bg-gray-900 text-white text-sm rounded px-2 py-1 shadow-md whitespace-nowrap">
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
