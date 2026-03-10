import { useEffect, useState } from "react";

export interface DropdownViewportData {
  triggerTop: number;
  triggerBottom: number;
  left: number;
  width: number;
  spaceAbove: number;
  spaceBelow: number;
}

export const useDropdownPosition = (
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLDivElement>,
  minWidth?: number
): DropdownViewportData => {
  const [data, setData] = useState<DropdownViewportData>({
    triggerTop: 0,
    triggerBottom: 0,
    left: 0,
    width: 0,
    spaceAbove: 0,
    spaceBelow: 0,
  });

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      const current = triggerRef.current;
      if (!current) return;
      const rect = current.getBoundingClientRect();

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const dropdownWidth = Math.max(rect.width, minWidth ?? 0);
      const viewportWidth = window.innerWidth;
      const leftAligned = rect.left;
      const rightAligned = rect.right - dropdownWidth;
      const left = leftAligned + dropdownWidth > viewportWidth ? Math.max(0, rightAligned) : leftAligned;

      setData({
        triggerTop: rect.top,
        triggerBottom: rect.bottom,
        left,
        width: rect.width,
        spaceAbove,
        spaceBelow,
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

  return data;
};
