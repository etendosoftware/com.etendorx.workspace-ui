import { useCallback, useEffect } from "react";
import useDebounce from "@/hooks/useDebounce";

export interface Option {
  id: string;
  label: string;
  data?: unknown;
}

export const useKeyboardNavigation = (
  filteredOptions: Option[],
  highlightedIndex: number,
  setHighlightedIndex: (index: number | ((prev: number) => number)) => void,
  onSelect: (option: Option) => void,
  onClose: () => void
) => {
  return useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev: number) => (prev + 1) % filteredOptions.length);
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev: number) => (prev <= 0 ? filteredOptions.length - 1 : prev - 1));
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

export const useClickOutside = (wrapperRef: React.RefObject<HTMLDivElement>, setIsOpen: (isOpen: boolean) => void) => {
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    },
    [wrapperRef, setIsOpen]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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

export const handleKeyboardActivation = (e: React.KeyboardEvent, callback: () => void) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    callback();
  }
};
