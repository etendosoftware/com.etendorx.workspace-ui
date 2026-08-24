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

import { useCallback, useEffect, useRef, useState } from "react";
import { useThrottle } from "../../hooks/useThrottle";

/** Percentage both directions snap back to on a double-click. */
export const RESIZE_RESET_PERCENTAGE = 50;

/**
 * `wrapper` (default) keeps the legacy shape: the root wraps `children` and a
 * drag can start anywhere on it.
 * `divider` renders only the grab bar, meant to sit *between* two sibling
 * panes — a drag can only start on the bar itself.
 */
export type ResizeHandleVariant = "wrapper" | "divider";

/**
 * Guards the legacy wrapper variant against starting a drag when the user is
 * really interacting with a control inside the wrapped content.
 */
export const isInteractiveTarget = (target: HTMLElement): boolean => {
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "BUTTON" || tag === "TEXTAREA") {
    return true;
  }
  return Boolean(
    target.closest("input") ||
      target.closest("button") ||
      target.closest("textarea") ||
      target.closest('[role="button"]') ||
      target.closest("[tabindex]")
  );
};

/** Percentage points a single arrow-key press moves a divider. */
export const RESIZE_KEYBOARD_STEP = 2;

/**
 * Signed step for an arrow key, or 0 when the key does not resize this divider.
 * A vertical divider (a horizontal bar) responds to Up/Down, a horizontal one to
 * Left/Right — and Up grows the pane below it, matching the drag direction.
 */
export const getResizeStepForKey = (key: string, isVertical: boolean): number => {
  if (isVertical) {
    if (key === "ArrowUp") return RESIZE_KEYBOARD_STEP;
    if (key === "ArrowDown") return -RESIZE_KEYBOARD_STEP;
    return 0;
  }
  if (key === "ArrowRight") return RESIZE_KEYBOARD_STEP;
  if (key === "ArrowLeft") return -RESIZE_KEYBOARD_STEP;
  return 0;
};

interface ResizeHandleProps {
  onHeightChange?: (height: number) => void;
  onWidthChange?: (width: number) => void;
  /** Fired once when a drag ends, with the final value. Use it to persist. */
  onHeightChangeEnd?: (height: number) => void;
  onWidthChangeEnd?: (width: number) => void;
  initialHeight?: number;
  initialWidth?: number;
  minHeight?: number;
  minWidth?: number;
  maxHeight?: number;
  maxWidth?: number;
  maxOffsetRem?: number;
  children?: React.ReactNode;
  hideHandle?: boolean;
  direction?: "vertical" | "horizontal";
  variant?: ResizeHandleVariant;
  /**
   * Element the percentages are relative to. Defaults to the viewport, which is
   * only correct when the resized element spans it. A divider between panes
   * must pass the panes container, otherwise the drag lags the pointer.
   */
  containerRef?: React.RefObject<HTMLElement | null>;
}

const ResizeHandle = ({
  onHeightChange,
  onWidthChange,
  onHeightChangeEnd,
  onWidthChangeEnd,
  initialHeight = 50,
  initialWidth = 50,
  minHeight = 10,
  minWidth = 10,
  maxHeight = 100,
  maxWidth = 50,
  maxOffsetRem = 9,
  children,
  hideHandle = false,
  direction = "vertical",
  variant = "wrapper",
  containerRef,
}: ResizeHandleProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentHeight, setCurrentHeight] = useState(initialHeight);
  const [currentWidth, setCurrentWidth] = useState(initialWidth);
  const startY = useRef(0);
  const startX = useRef(0);
  const startHeight = useRef(0);
  const startWidth = useRef(0);

  const isVertical = direction === "vertical";
  const isDivider = variant === "divider";
  const lastEmittedRef = useRef<number | null>(null);

  /**
   * Pixel size the percentages are measured against. Falls back to the viewport
   * when no container is given (legacy behaviour) or when the container has not
   * been laid out yet (0 in jsdom).
   */
  const getBasisSize = useCallback(() => {
    const rect = containerRef?.current?.getBoundingClientRect();
    const containerSize = isVertical ? rect?.height : rect?.width;
    if (containerSize && containerSize > 0) {
      return containerSize;
    }
    return isVertical ? window.innerHeight : window.innerWidth;
  }, [containerRef, isVertical]);

  const calculateHeightLimits = useCallback(() => {
    const remInPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const basis = getBasisSize();
    const maxHeightPx = basis - maxOffsetRem * remInPx;
    const maxHeightPercentage = (maxHeightPx / basis) * 100;
    const clampedMax = maxHeight ? Math.min(maxHeight, maxHeightPercentage) : maxHeightPercentage;
    return {
      min: minHeight,
      max: Math.max(clampedMax, minHeight),
    };
  }, [minHeight, maxOffsetRem, maxHeight, getBasisSize]);

  const calculateWidthLimits = useCallback(() => {
    const remInPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const basis = getBasisSize();
    const maxWidthPx = basis - maxOffsetRem * remInPx;
    const maxWidthPercentage = (maxWidthPx / basis) * 100;
    const clampedMax = maxWidth ? Math.min(maxWidth, maxWidthPercentage) : maxWidthPercentage;
    return {
      min: minWidth,
      max: Math.max(clampedMax, minWidth),
    };
  }, [minWidth, maxOffsetRem, maxWidth, getBasisSize]);

  const throttledWindowResize = useThrottle(
    useCallback(() => {
      if (isVertical && onHeightChange) {
        const { min, max } = calculateHeightLimits();
        if (currentHeight > max) {
          const clampedHeight = max;
          setCurrentHeight(clampedHeight);
          onHeightChange(clampedHeight);
        } else if (currentHeight < min) {
          const clampedHeight = min;
          setCurrentHeight(clampedHeight);
          onHeightChange(clampedHeight);
        }
      } else if (!isVertical && onWidthChange) {
        const { min, max } = calculateWidthLimits();
        if (currentWidth > max) {
          const clampedWidth = max;
          setCurrentWidth(clampedWidth);
          onWidthChange(clampedWidth);
        } else if (currentWidth < min) {
          const clampedWidth = min;
          setCurrentWidth(clampedWidth);
          onWidthChange(clampedWidth);
        }
      }
    }, [
      currentHeight,
      currentWidth,
      calculateHeightLimits,
      calculateWidthLimits,
      onHeightChange,
      onWidthChange,
      isVertical,
    ]),
    50
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only the wrapper variant needs this guard: a divider has no children to
      // protect, and its own bar is the sole drag surface.
      if (!isDivider && isInteractiveTarget(e.target as HTMLElement)) {
        return;
      }

      e.preventDefault();
      setIsDragging(true);
      limitsRef.current = null;
      lastEmittedRef.current = null;

      if (isVertical) {
        startY.current = e.clientY;
        startHeight.current = currentHeight;
      } else {
        startX.current = e.clientX;
        startWidth.current = currentWidth;
      }
    },
    [currentHeight, currentWidth, isVertical, isDivider]
  );

  const limitsRef = useRef<{ min: number; max: number } | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      if (isVertical && onHeightChange) {
        const totalDeltaY = startY.current - e.clientY;
        const percentageDelta = (totalDeltaY / getBasisSize()) * 100;

        if (!limitsRef.current) {
          limitsRef.current = calculateHeightLimits();
        }
        const { min, max } = limitsRef.current;

        const newHeight = Math.min(Math.max(startHeight.current + percentageDelta, min), max);

        document.body.style.cursor = "ns-resize";
        document.body.style.userSelect = "none";
        lastEmittedRef.current = newHeight;
        setCurrentHeight(newHeight);
        onHeightChange(newHeight);
      } else if (!isVertical && onWidthChange) {
        const totalDeltaX = e.clientX - startX.current;
        const percentageDelta = (totalDeltaX / getBasisSize()) * 100;

        if (!limitsRef.current) {
          limitsRef.current = calculateWidthLimits();
        }
        const { min, max } = limitsRef.current;

        const newWidth = Math.min(Math.max(startWidth.current + percentageDelta, min), max);

        document.body.style.cursor = "ew-resize";
        document.body.style.userSelect = "none";
        lastEmittedRef.current = newWidth;
        setCurrentWidth(newWidth);
        onWidthChange(newWidth);
      }
    },
    [isDragging, calculateHeightLimits, calculateWidthLimits, onHeightChange, onWidthChange, isVertical, getBasisSize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    limitsRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    const finalValue = lastEmittedRef.current;
    lastEmittedRef.current = null;
    if (finalValue === null) return;

    if (isVertical) {
      onHeightChangeEnd?.(finalValue);
    } else {
      onWidthChangeEnd?.(finalValue);
    }
  }, [isVertical, onHeightChangeEnd, onWidthChangeEnd]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    window.addEventListener("resize", throttledWindowResize);
    return () => window.removeEventListener("resize", throttledWindowResize);
  }, [throttledWindowResize]);

  const handleDoubleClick = useCallback(() => {
    if (isVertical) {
      if (!onHeightChange) return;
      setCurrentHeight(RESIZE_RESET_PERCENTAGE);
      onHeightChange(RESIZE_RESET_PERCENTAGE);
      onHeightChangeEnd?.(RESIZE_RESET_PERCENTAGE);
      return;
    }
    // Horizontal reset is opt-in: the Drawer wraps its whole content in a
    // horizontal wrapper, where a double-click on a menu item must not resize.
    if (!isDivider || !onWidthChange) return;
    setCurrentWidth(RESIZE_RESET_PERCENTAGE);
    onWidthChange(RESIZE_RESET_PERCENTAGE);
    onWidthChangeEnd?.(RESIZE_RESET_PERCENTAGE);
  }, [onHeightChange, onHeightChangeEnd, onWidthChange, onWidthChangeEnd, isVertical, isDivider]);

  /**
   * Keyboard resizing for the divider, so the focusable separator is actually
   * operable without a pointer. One press moves the split by one step.
   */
  const handleDividerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = getResizeStepForKey(e.key, isVertical);
      if (step === 0) return;
      e.preventDefault();

      if (isVertical) {
        const { min, max } = calculateHeightLimits();
        const next = Math.min(Math.max(currentHeight + step, min), max);
        setCurrentHeight(next);
        onHeightChange?.(next);
        onHeightChangeEnd?.(next);
        return;
      }

      const { min, max } = calculateWidthLimits();
      const next = Math.min(Math.max(currentWidth + step, min), max);
      setCurrentWidth(next);
      onWidthChange?.(next);
      onWidthChangeEnd?.(next);
    },
    [
      isVertical,
      currentHeight,
      currentWidth,
      calculateHeightLimits,
      calculateWidthLimits,
      onHeightChange,
      onHeightChangeEnd,
      onWidthChange,
      onWidthChangeEnd,
    ]
  );

  const getHandleClasses = () => {
    const baseClasses = "absolute transition-all duration-200";
    const activeClasses = isDragging
      ? "bg-blue-400 shadow-lg scale-110"
      : "bg-(--color-baseline-30) group-hover:bg-(--color-baseline-40) group-hover:scale-105";

    if (isVertical) {
      return `${baseClasses} top-0 left-1/2 -translate-x-1/2 w-10 h-1 mt-1 rounded-lg ${activeClasses}`;
    }

    return `${baseClasses} right-0 top-1/2 -translate-y-1/2 w-1 h-10 ml-1 rounded-lg ${activeClasses}`;
  };

  const getOverflowClass = () => {
    return isVertical ? "overflow-auto h-full" : "overflow-auto w-full";
  };

  const getIdleCursorClass = () => {
    if (isDragging) return "";
    if (isVertical) return "cursor-ns-resize";
    return "cursor-ew-resize";
  };
  const cursorClass = getIdleCursorClass();

  const getDividerContainerClasses = () => {
    const baseClasses = `group relative shrink-0 flex items-center justify-center ${cursorClass}`;
    if (isVertical) {
      return `${baseClasses} w-full h-2`;
    }
    return `${baseClasses} w-2 h-full`;
  };

  const getDividerBarClasses = () => {
    const baseClasses = "rounded-lg transition-all duration-200";
    const activeClasses = isDragging
      ? "bg-blue-400 shadow-lg"
      : "bg-(--color-baseline-30) group-hover:bg-(--color-baseline-40)";
    if (isVertical) {
      return `${baseClasses} h-0.5 w-10 ${activeClasses}`;
    }
    return `${baseClasses} w-0.5 h-10 ${activeClasses}`;
  };

  if (isDivider) {
    const currentValue = isVertical ? currentHeight : currentWidth;
    return (
      // biome-ignore lint/a11y/useSemanticElements: <hr> cannot hold the grab bar this separator needs
      <div
        role="separator"
        tabIndex={0}
        aria-orientation={isVertical ? "horizontal" : "vertical"}
        aria-valuenow={Math.round(currentValue)}
        aria-valuemin={isVertical ? minHeight : minWidth}
        aria-valuemax={isVertical ? maxHeight : maxWidth}
        className={getDividerContainerClasses()}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleDividerKeyDown}
      >
        <div data-resizer className={getDividerBarClasses()} />
      </div>
    );
  }

  return (
    <div className={`relative group ${cursorClass}`} onMouseDown={handleMouseDown} onDoubleClick={handleDoubleClick}>
      <div
        className={`
          relative
          flex items-center justify-center
          transition-colors duration-200
          bg-(--color-transparent-neutral-5)
        `}>
        {!hideHandle && (
          <div className="flex space-x-1 transition-opacity duration-200">
            <div data-resizer className={getHandleClasses()} />
          </div>
        )}
      </div>
      <div className={getOverflowClass()}>{children}</div>
    </div>
  );
};

export default ResizeHandle;
