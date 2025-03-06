import React, { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import TabContainer from './TabContainer';
import type { ResizableTabContainerProps, SelectedRecord } from './types';
import { useMetadataContext } from '@/hooks/useMetadataContext';

const MAX_HEIGHT = 94;
const MIN_HEIGHT = 20;
const DEFAULT_HEIGHT = 40;

const ResizableTabContainer: React.FC<ResizableTabContainerProps> = memo(
  ({ isOpen, onClose, selectedRecord, onHeightChange, tab, windowId }) => {
    const [containerHeight, setContainerHeight] = useState(DEFAULT_HEIGHT);
    const containerRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);
    const { tabs } = useMetadataContext();

    const childTabs = useMemo(() => {
      if (!selectedRecord || !tab) return [];
      return tabs.filter(t => t.level === tab.level + 1);
    }, [selectedRecord, tab, tabs]);

    const handleHeightChange = useCallback(
      (newHeight: number) => {
        const clampedHeight = Math.min(Math.max(newHeight, MIN_HEIGHT), MAX_HEIGHT);
        setContainerHeight(clampedHeight);
        setIsFullSize(clampedHeight === MAX_HEIGHT);
        onHeightChange?.(clampedHeight);
      },
      [onHeightChange],
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent | MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        const startY = e.clientY;
        const startHeight = containerHeight;

        const handleMouseMove = (e: MouseEvent) => {
          if (!isResizing.current) return;
          const dy = startY - e.clientY;
          const newHeight = startHeight + (dy / window.innerHeight) * 100;
          handleHeightChange(newHeight);
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
      [containerHeight, handleHeightChange],
    );

    useEffect(() => {
      const resizer = containerRef.current?.querySelector('[data-resizer]');
      if (resizer) {
        resizer.addEventListener('mousedown', handleMouseDown as EventListener);
        return () => resizer.removeEventListener('mousedown', handleMouseDown as EventListener);
      }
    }, [handleMouseDown]);

    const handleDoubleClick = useCallback(() => {
      handleHeightChange(containerHeight === MAX_HEIGHT ? DEFAULT_HEIGHT : MAX_HEIGHT);
    }, [containerHeight, handleHeightChange]);

    const [isFullSize, setIsFullSize] = useState(false);

    return (
      <div
        ref={containerRef}
        className="sticky bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out"
        style={{
          height: `${containerHeight}vh`,
          borderTopLeftRadius: '1rem',
          borderTopRightRadius: '1rem',
          border: '2px solid var(--transparent-neutral-10, rgba(0,3,13,0.1))',
          borderBottom: 'none',
          backgroundColor: 'var(--baseline-neutral-0, #FCFCFD)',
        }}>
        <div
          data-resizer
          className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-2 mt-1 rounded-lg cursor-ns-resize"
          style={{
            backgroundColor: 'var(--baseline-neutral-30, #B1B8D8)',
          }}
        />
        <div className="h-full overflow-auto" onMouseDown={handleMouseDown} onDoubleClick={handleDoubleClick}>
          <TabContainer
            isOpen={isOpen}
            onClose={onClose}
            selectedRecord={selectedRecord as SelectedRecord}
            tab={tab}
            childTabs={childTabs}
            windowId={windowId}
            handleFullSize={handleDoubleClick}
            isFullSize={isFullSize}
          />
        </div>
      </div>
    );
  },
);

ResizableTabContainer.displayName = 'ResizableTabContainer';

export default ResizableTabContainer;
