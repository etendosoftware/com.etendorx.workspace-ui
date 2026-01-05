import { useEffect, useState } from "react";

export const useDropdownPosition = (
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLDivElement>,
  filteredOptionsCount: number,
  hasSearchInput = true
) => {
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    showAbove: false,
  });

  const [fixedOrientation, setFixedOrientation] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setFixedOrientation(null);
      return;
    }

    const updatePosition = () => {
      const current = triggerRef.current;
      if (!current) return;
      const rect = current.getBoundingClientRect();
      const searchInputHeight = hasSearchInput ? 56 : 0;
      const optionHeight = 44;
      const maxOptionsVisible = 6;

      const visibleOptions = Math.min(filteredOptionsCount || 1, maxOptionsVisible);
      const dynamicDropdownHeight = searchInputHeight + visibleOptions * optionHeight;

      let shouldShowAbove: boolean;

      if (fixedOrientation !== null) {
        shouldShowAbove = fixedOrientation;
      } else {
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        shouldShowAbove = spaceBelow < dynamicDropdownHeight && spaceAbove > spaceBelow;

        setFixedOrientation(shouldShowAbove);
      }

      let top: number;
      if (shouldShowAbove) {
        top = rect.top + window.scrollY - dynamicDropdownHeight - 4;
      } else {
        top = rect.bottom + window.scrollY + 4;
      }

      setPosition({
        top,
        left: rect.left + window.scrollX,
        width: rect.width,
        showAbove: shouldShowAbove,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, triggerRef, filteredOptionsCount, hasSearchInput, fixedOrientation]);

  return position;
};
