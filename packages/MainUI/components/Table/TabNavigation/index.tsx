import { useState, useRef, useCallback, useEffect } from 'react';
import type { ResizableTabContainerProps } from './types';

const MAX_HEIGHT = 91;
const MIN_HEIGHT = 20;
const DEFAULT_HEIGHT = 40;

function throttle<T extends (...args: number[]) => unknown>(func: T, delay: number): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

const ResizableTabContainer: React.FC<React.PropsWithChildren<ResizableTabContainerProps>> = ({ isOpen, children }) => {
  const [containerHeight, setContainerHeight] = useState(isMainTab ? MAX_HEIGHT : DEFAULT_HEIGHT);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const lastHeightRef = useRef(0);

  const handleHeightChange = useCallback(
    (newHeight: number) => {
      const clampedHeight = Math.min(Math.max(newHeight, MIN_HEIGHT), MAX_HEIGHT);
      lastHeightRef.current = clampedHeight;

      requestAnimationFrame(() => {
        setContainerHeight(clampedHeight);
      });
    },
    [],
  );

  const throttledHeightChange = throttle((height: number) => handleHeightChange(height), 10);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (isMainTab) return;

      const target = e.target as HTMLElement;
      const isResizer = target.hasAttribute('data-resizer');
      const header = target.closest('[data-header]');

      if (
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.getAttribute('role') === 'button'
      ) {
        return;
      }

      if (!isResizer && !header) {
        return;
      }

      e.preventDefault();
      isResizing.current = true;
      setIsDragging(true);

      const initialMouseY = e.clientY;
      const initialHeightPx = containerRef.current?.getBoundingClientRect().height || 0;
      const windowHeight = window.innerHeight;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;

        const mouseDeltaY = initialMouseY - e.clientY;
        const newHeightPx = initialHeightPx + mouseDeltaY;
        const newHeightVh = (newHeightPx / windowHeight) * 100;

        throttledHeightChange(newHeightVh);
        window.getSelection()?.removeAllRanges();
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
    },
    [isMainTab, throttledHeightChange],
  );

  const handleDoubleClick = useCallback(() => {
    if (isMainTab) return;

    if (containerHeight !== MAX_HEIGHT) {
      setTimeout(() => {
        handleHeightChange(MAX_HEIGHT);
      }, 50);
    } else {
      handleHeightChange(DEFAULT_HEIGHT);
    }
  }, [containerHeight, handleHeightChange, isMainTab]);

  useEffect(() => {
    const resizer = containerRef.current?.querySelector('[data-resizer]');
    if (resizer) {
      resizer.addEventListener('mousedown', handleMouseDown as EventListener);
    }

    const handleHeaderEvent = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const header = target.closest('[data-header]');

      if (header && !isMainTab) {
        if (
          target.tagName !== 'BUTTON' &&
          !target.closest('button') &&
          target.tagName !== 'INPUT' &&
          target.tagName !== 'SELECT' &&
          target.getAttribute('role') !== 'button'
        ) {
          handleMouseDown(e);
        }
      }
    };

    document.addEventListener('mousedown', handleHeaderEvent);

    return () => {
      if (resizer) {
        resizer.removeEventListener('mousedown', handleMouseDown as EventListener);
      }
      document.removeEventListener('mousedown', handleHeaderEvent);
    };
  }, [handleMouseDown, isMainTab]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-0 mx-1 z-50 w-fill-available 
          ${isDragging ? '' : 'transition-all transform-gpu duration-[20ms] ease-in-out'} 
          rounded-t-2xl border-2 border-[rgba(0,3,13,0.1)] border-b-0 bg-neutral-50`}
      style={{ height: `${containerHeight}vh` }}>
      <div
        data-resizer
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-16 h-2 mt-1 rounded-xl bg-primary-100
            ${isMainTab ? 'cursor-default opacity-50' : 'cursor-ns-resize opacity-100 hover:bg-primary-200'}`}
        onDoubleClick={isMainTab ? undefined : handleDoubleClick}
      />
      <div className="h-full overflow-auto">{children}</div>
    </div>
  );
};

export default ResizableTabContainer;
