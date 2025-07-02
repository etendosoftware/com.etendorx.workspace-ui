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

  const updateScrollButtons = useCallback((container: HTMLDivElement) => {
    const hasHorizontalScroll = container.scrollWidth > container.clientWidth;
    setShowLeftScrollButton(hasHorizontalScroll);
    setShowRightScrollButton(hasHorizontalScroll);
    setShowRightMenuButton(hasHorizontalScroll);
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

  const handleScrollLeft = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const container = windowsContainerRef.current;
    if (container) {
      container.scrollBy({
        left: -DEFAULT_SCROLL_AMOUNT,
        behavior: "smooth",
      });
      const newScrollLeft = container.scrollLeft - DEFAULT_SCROLL_AMOUNT;
      const isAtStart = newScrollLeft <= 0;
      if (isAtStart) {
        setShowLeftScrollButton(false);
      }
      setShowRightScrollButton(true);
    }
  }, []);

  const handleScrollRight = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const container = windowsContainerRef.current;
    if (container) {
      container.scrollBy({
        left: DEFAULT_SCROLL_AMOUNT,
        behavior: "smooth",
      });
      const newScrollRight = container.scrollLeft + DEFAULT_SCROLL_AMOUNT;
      const isAtEnd = newScrollRight + container.clientWidth >= container.scrollWidth - DEFAULT_BUTTON_ICON_SIZE;
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
