import { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import TabContainer from './TabContainer';
import type { ResizableTabContainerProps, SelectedRecord } from './types';
import { useMetadataContext } from '@/hooks/useMetadataContext';

const MAX_HEIGHT = 100;
const MIN_HEIGHT = 20;
const DEFAULT_HEIGHT = 40;

const ResizableTabContainer: React.FC<ResizableTabContainerProps> = memo(
  ({ isOpen, onClose, selectedRecord, onHeightChange, tab, windowId, isMainTab = false }) => {
    const [containerHeight, setContainerHeight] = useState(isMainTab ? MAX_HEIGHT : DEFAULT_HEIGHT);
    const [isFullSize, setIsFullSize] = useState(isMainTab ? true : false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);
    const { tabs, activeTabLevels } = useMetadataContext();

    const tabLevel = tab?.level || 0;
    const isVisible = activeTabLevels.includes(tabLevel);
    const shouldRender = isOpen && isVisible;

    const childTabs = useMemo(() => {
      if (!selectedRecord || !tab) return [];
      return tabs.filter(t => t.level === tab.level + 1);
    }, [selectedRecord, tab, tabs]);

    useEffect(() => {
      if (isMainTab && containerHeight !== MAX_HEIGHT) {
        setContainerHeight(MAX_HEIGHT);
        setIsFullSize(true);
        onHeightChange?.(MAX_HEIGHT);
      }
    }, [isMainTab, containerHeight, onHeightChange]);

    const handleHeightChange = useCallback(
      (newHeight: number) => {
        if (isMainTab) return;

        const clampedHeight = Math.min(Math.max(newHeight, MIN_HEIGHT), MAX_HEIGHT);
        setContainerHeight(clampedHeight);
        setIsFullSize(clampedHeight === MAX_HEIGHT);
        onHeightChange?.(clampedHeight);
      },
      [onHeightChange, isMainTab],
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent | MouseEvent) => {
        if (isMainTab) return;

        e.preventDefault();
        isResizing.current = true;

        const initialMouseY = e.clientY;
        const initialHeightPx = containerRef.current?.getBoundingClientRect().height || 0;
        const windowHeight = window.innerHeight;

        const handleMouseMove = (e: MouseEvent) => {
          if (!isResizing.current) return;
          const mouseDeltaY = initialMouseY - e.clientY;
          const newHeightPx = initialHeightPx + mouseDeltaY;
          const newHeightVh = (newHeightPx / windowHeight) * 100;

          handleHeightChange(newHeightVh);

          window.getSelection()?.removeAllRanges();
        };

        const handleMouseUp = () => {
          isResizing.current = false;
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'ns-resize';
      },
      [handleHeightChange, isMainTab],
    );

    useEffect(() => {
      const resizer = containerRef.current?.querySelector('[data-resizer]');
      if (resizer) {
        resizer.addEventListener('mousedown', handleMouseDown as EventListener);
        return () => resizer.removeEventListener('mousedown', handleMouseDown as EventListener);
      }
    }, [handleMouseDown]);

    const handleDoubleClick = useCallback(() => {
      if (isMainTab) return;

      handleHeightChange(containerHeight === MAX_HEIGHT ? DEFAULT_HEIGHT : MAX_HEIGHT);
    }, [containerHeight, handleHeightChange, isMainTab]);

    useEffect(() => {
      if (isMainTab) {
        setIsFullSize(true);
      }
    }, [isMainTab]);

    if (!shouldRender) return null;

    return (
      <div
        ref={containerRef}
        className={`sticky bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
          rounded-t-2xl border-2 border-[rgba(0,3,13,0.1)] border-b-0 bg-[#FCFCFD]`}
        style={{ height: `${containerHeight}vh` }}>
        <div
          data-resizer
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-16 h-2 mt-1 rounded-lg bg-[#B1B8D8]
            ${isMainTab ? 'cursor-default opacity-50' : 'cursor-ns-resize opacity-100'}`}
        />
        <div
          className="h-full overflow-auto"
          onMouseDown={isMainTab ? undefined : handleMouseDown}
          onDoubleClick={isMainTab ? undefined : handleDoubleClick}>
          <TabContainer
            isOpen={isOpen}
            onClose={onClose}
            selectedRecord={selectedRecord as SelectedRecord}
            tab={tab}
            childTabs={childTabs}
            windowId={windowId}
            handleFullSize={handleDoubleClick}
            isFullSize={isFullSize}
            isMainTab={isMainTab}
          />
        </div>
      </div>
    );
  },
);

ResizableTabContainer.displayName = 'ResizableTabContainer';

export default ResizableTabContainer;
