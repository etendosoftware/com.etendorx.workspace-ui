import { useCallback, useEffect, type RefObject } from "react";
import useDebounce from "@/hooks/useDebounce";

export interface Option {
  id: string;
  label: string;
  data?: unknown;
}
export const useKeyboardNavigation = <T extends Element = Element>(
  filteredOptions: Option[],
  highlightedIndex: number,
  setHighlightedIndex: (index: number | ((prev: number) => number)) => void,
  onSelect: (option: Option) => void,
  onClose: () => void
) => {
  return useCallback(
    (e: React.KeyboardEvent<T>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev <= 0 ? filteredOptions.length - 1 : prev - 1));
      }

      if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        const option = filteredOptions[highlightedIndex];
        if (option) onSelect(option);
      }

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [filteredOptions, highlightedIndex, setHighlightedIndex, onSelect, onClose]
  );
};

export const useClickOutside = (
  wrapperRef: RefObject<HTMLDivElement>,
  setIsOpen: (isOpen: boolean) => void,
  additionalRefs?: RefObject<HTMLElement>[]
) => {
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const target = event.target as Node;

      // If click is inside the main wrapper, ignore
      if (wrapperRef.current?.contains(target)) return;

      // If click is inside any of the additional refs (e.g., portal content), ignore
      if (additionalRefs && additionalRefs.length > 0) {
        for (const ref of additionalRefs) {
          if (ref?.current?.contains(target)) return;
        }
      }

      // Otherwise, close
      setIsOpen(false);
    },
    [wrapperRef, setIsOpen, additionalRefs]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [handleClickOutside]);

  return handleClickOutside;
};

export const useSearchHandler = (onSearch?: (term: string) => void) => {
  const debouncedSetSearchTerm = useDebounce(onSearch);

  return useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = e.target.value;

      if (debouncedSetSearchTerm) {
        debouncedSetSearchTerm(term);
      }

      return term;
    },
    [debouncedSetSearchTerm]
  );
};

export const useInfiniteScroll = (
  listRef: React.RefObject<HTMLUListElement>,
  loading: boolean,
  hasMore: boolean,
  onLoadMore?: () => void
) => {
  return useCallback(() => {
    if (!listRef.current || loading || !hasMore) return;

    const list = listRef.current;
    const scrollBottom = list.scrollTop + list.clientHeight;

    if (scrollBottom >= list.scrollHeight * 0.9) {
      onLoadMore?.();
    }
  }, [listRef, loading, hasMore, onLoadMore]);
};

export const useHoverHandlers = (setIsHovering: (isHovering: boolean) => void) => {
  return {
    handleMouseEnter: useCallback(() => {
      setIsHovering(true);
    }, [setIsHovering]),
    handleMouseLeave: useCallback(() => {
      setIsHovering(false);
    }, [setIsHovering]),
  };
};

export const useFocusHandler = (onFocus?: () => void) => {
  return useCallback(() => {
    onFocus?.();
  }, [onFocus]);
};

export const useSearchTermHandler = (
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => string,
  setSearchTerm: (term: string) => void
) => {
  return useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = handleSearchChange(e);
      setSearchTerm(term);
    },
    [handleSearchChange, setSearchTerm]
  );
};

export const useOpenDropdownEffect = (
  isOpen: boolean,
  setSearchTerm: (term: string) => void,
  setHighlightedIndex: (index: number) => void,
  searchInputRef: React.RefObject<HTMLInputElement>
) => {
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setHighlightedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 1);
    }
  }, [isOpen, setSearchTerm, setHighlightedIndex, searchInputRef]);
};

export const handleKeyboardActivation = (e: React.KeyboardEvent, callback: () => void) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    callback();
  }
};
