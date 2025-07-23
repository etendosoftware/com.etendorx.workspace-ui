import { useCallback, useEffect, useRef, useState } from "react";
import { useThrottle } from "../../hooks/useThrottle";

interface ResizeHandleProps {
  onHeightChange?: (height: number) => void;
  onWidthChange?: (width: number) => void;
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
}

const ResizeHandle = ({
  onHeightChange,
  onWidthChange,
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
}: ResizeHandleProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentHeight, setCurrentHeight] = useState(initialHeight);
  const [currentWidth, setCurrentWidth] = useState(initialWidth);
  const startY = useRef(0);
  const startX = useRef(0);
  const startHeight = useRef(0);
  const startWidth = useRef(0);

  const isVertical = direction === "vertical";

  const calculateHeightLimits = useCallback(() => {
    const remInPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const maxHeightPx = window.innerHeight - maxOffsetRem * remInPx;
    const maxHeightPercentage = (maxHeightPx / window.innerHeight) * 100;
    const clampedMax = maxHeight ? Math.min(maxHeight, maxHeightPercentage) : maxHeightPercentage;
    return {
      min: minHeight,
      max: Math.max(clampedMax, minHeight),
    };
  }, [minHeight, maxOffsetRem, maxHeight]);

  const calculateWidthLimits = useCallback(() => {
    const remInPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const maxWidthPx = window.innerWidth - maxOffsetRem * remInPx;
    const maxWidthPercentage = (maxWidthPx / window.innerWidth) * 100;
    const clampedMax = maxWidth ? Math.min(maxWidth, maxWidthPercentage) : maxWidthPercentage;
    return {
      min: minWidth,
      max: Math.max(clampedMax, minWidth),
    };
  }, [minWidth, maxOffsetRem, maxWidth]);

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
    250
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      if (isVertical) {
        startY.current = e.clientY;
        startHeight.current = currentHeight;
      } else {
        startX.current = e.clientX;
        startWidth.current = currentWidth;
      }
    },
    [currentHeight, currentWidth, isVertical]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      if (isVertical && onHeightChange) {
        const totalDeltaY = startY.current - e.clientY;
        const percentageDelta = (totalDeltaY / window.innerHeight) * 100;
        const { min, max } = calculateHeightLimits();
        const newHeight = Math.min(Math.max(startHeight.current + percentageDelta, min), max);

        document.body.style.cursor = "ns-resize";
        document.body.style.userSelect = "none";
        setCurrentHeight(newHeight);
        onHeightChange(newHeight);
      } else if (!isVertical && onWidthChange) {
        const totalDeltaX = e.clientX - startX.current;
        const percentageDelta = (totalDeltaX / window.innerWidth) * 100;
        const { min, max } = calculateWidthLimits();
        const newWidth = Math.min(Math.max(startWidth.current + percentageDelta, min), max);

        document.body.style.cursor = "ew-resize";
        document.body.style.userSelect = "none";
        setCurrentWidth(newWidth);
        onWidthChange(newWidth);
      }
    },
    [isDragging, calculateHeightLimits, calculateWidthLimits, onHeightChange, onWidthChange, isVertical]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

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
    if (isVertical && onHeightChange) {
      setCurrentHeight(50);
      onHeightChange(50);
    }
  }, [onHeightChange, isVertical]);

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

  return (
    <div
      className={`relative group ${!isDragging ? (isVertical ? "cursor-ns-resize" : "cursor-ew-resize") : ""}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}>
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
