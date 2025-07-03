"use client";

import { createContext, useContext, useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";

type TabsContextType = {
  containerRef: React.RefObject<HTMLDivElement>;
  windowsContainerRef: React.RefObject<HTMLDivElement>;
  tabRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  showLeftScrollButton: boolean;
  showRightScrollButton: boolean;
  showRightMenuButton: boolean;
  handleScrollLeft: (e: React.MouseEvent) => void;
  handleScrollRight: (e: React.MouseEvent) => void;
};

const DEFAULT_SCROLL_AMOUNT = 200;
const DEFAULT_BUTTON_ICON_SIZE = 50;
const DRAWER_STATE_KEY = "etendo-drawer-open";
const DEFAULT_DEBOUNCE_DELAY = 200;

const checkIfAtStart = (scrollLeft: number) => {
  return scrollLeft <= 0;
};

const checkIfAtEnd = (scrollRight: number, clientWidth: number, scrollWidth: number) => {
  return scrollRight + clientWidth >= scrollWidth - DEFAULT_BUTTON_ICON_SIZE;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export default function TabsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeWindow } = useMultiWindowURL();

  const containerRef = useRef<HTMLDivElement>(null);
  const windowsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [showLeftScrollButton, setShowLeftScrollButton] = useState(false);
  const [showRightScrollButton, setShowRightScrollButton] = useState(false);
  const [showRightMenuButton, setShowRightMenuButton] = useState(false);

  const isDrawerOpen = useMemo(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(DRAWER_STATE_KEY);
    return saved ? JSON.parse(saved) : false;
  }, []);

  const updateScrollButtons = useCallback((windowsContainer: HTMLDivElement) => {
    const hasHorizontalScroll = windowsContainer.scrollWidth > windowsContainer.clientWidth;
    if (!hasHorizontalScroll) {
      setShowLeftScrollButton(false);
      setShowRightScrollButton(false);
      setShowRightMenuButton(false);
      return;
    }
    const isAtStart = checkIfAtStart(windowsContainer.scrollLeft);
    const isAtEnd = checkIfAtEnd(
      windowsContainer.scrollLeft,
      windowsContainer.clientWidth,
      windowsContainer.scrollWidth
    );
    setShowLeftScrollButton(!isAtStart);
    setShowRightScrollButton(!isAtEnd);
    setShowRightMenuButton(true);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const windowsContainer = windowsContainerRef.current;
    if (!container || !windowsContainer) return;

    let lastWidth = container.clientWidth;
    let timeoutId: NodeJS.Timeout;

    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const currentWidth = container.clientWidth;
        const isDrawerWidthChange = currentWidth !== lastWidth;
        if (isDrawerWidthChange) {
          lastWidth = currentWidth;
          updateScrollButtons(windowsContainer);
        }
      }, DEFAULT_DEBOUNCE_DELAY);
    };

    const resizeObserver = new ResizeObserver(debouncedResize);

    resizeObserver.observe(windowsContainer);

    updateScrollButtons(windowsContainer);

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeWindow, isDrawerOpen, updateScrollButtons]);

  useEffect(() => {
    if (!activeWindow) return;
    const tabElement = tabRefs.current[activeWindow.windowId];
    if (tabElement) {
      tabElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeWindow]);

  useEffect(() => {
    const windowsContainer = windowsContainerRef.current;
    if (!windowsContainer) return;

    const handleScrollEnd = () => {
      updateScrollButtons(windowsContainer);
    };

    // TODO: the scrollend is not work on safari
    windowsContainer.addEventListener("scrollend", handleScrollEnd);

    return () => {
      windowsContainer.removeEventListener("scrollend", handleScrollEnd);
    };
  }, [updateScrollButtons]);

  const handleScrollLeft = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const windowsContainer = windowsContainerRef.current;
    if (windowsContainer) {
      windowsContainer.scrollBy({
        left: -DEFAULT_SCROLL_AMOUNT,
        behavior: "smooth",
      });
      const newScrollLeft = windowsContainer.scrollLeft - DEFAULT_SCROLL_AMOUNT;
      const isAtStart = checkIfAtStart(newScrollLeft);
      if (isAtStart) {
        setShowLeftScrollButton(false);
      }
      setShowRightScrollButton(true);
    }
  }, []);

  const handleScrollRight = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const windowsContainer = windowsContainerRef.current;
    if (windowsContainer) {
      windowsContainer.scrollBy({
        left: DEFAULT_SCROLL_AMOUNT,
        behavior: "smooth",
      });
      const newScrollRight = windowsContainer.scrollLeft + DEFAULT_SCROLL_AMOUNT;
      const isAtEnd = checkIfAtEnd(newScrollRight, windowsContainer.clientWidth, windowsContainer.scrollWidth);
      if (isAtEnd) {
        setShowRightScrollButton(false);
      }
      setShowLeftScrollButton(true);
    }
  }, []);

  const value = useMemo<TabsContextType>(
    () => ({
      containerRef,
      windowsContainerRef,
      tabRefs,
      showLeftScrollButton,
      showRightScrollButton,
      showRightMenuButton,
      handleScrollLeft,
      handleScrollRight,
    }),
    [
      containerRef,
      windowsContainerRef,
      tabRefs,
      showLeftScrollButton,
      showRightScrollButton,
      showRightMenuButton,
      handleScrollLeft,
      handleScrollRight,
    ]
  );

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

export const useTabs = (): TabsContextType => {
  const context = useContext(TabsContext);

  if (context === undefined) {
    throw new Error("useTabs must be used within a TabsProvider");
  }

  return context;
};
