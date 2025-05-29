import { useThrottle } from '@/hooks/useThrottle';
import { useCallback, useEffect, useRef } from 'react';
import type { ResizableTabContainerProps } from './types';

const MAX_HEIGHT = 91;
const MIN_HEIGHT = 20;

const ResizableTabContainer: React.FC<React.PropsWithChildren<ResizableTabContainerProps>> = ({ isOpen, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const lastHeightRef = useRef(0);

  const onHeightChange = useCallback((newHeight: number) => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    requestAnimationFrame(() => {
      const clampedHeight = Math.min(Math.max(newHeight, MIN_HEIGHT), MAX_HEIGHT);
      lastHeightRef.current = clampedHeight;
      container.style.height = `${newHeight}vh`;
    });
  }, []);

  const handleHeightChange = useThrottle(onHeightChange, 100);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
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
    [handleHeightChange],
  );

  useEffect(() => {
    const resizer = containerRef.current?.querySelector('[data-resizer]');
    if (resizer) {
      resizer.addEventListener('mousedown', handleMouseDown as EventListener);
    }

    const handleHeaderEvent = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const header = target.closest('[data-header]');

      if (header) {
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
  }, [handleMouseDown]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={
        'fixed bottom-0 mx-1 z-50 w-fill-available transition-all transform-gpu duration-[400ms] ease-in-out rounded-t-2xl border-2 border-[rgba(0,3,13,0.1)] border-b-0 bg-neutral-50'
      }>
      <div
        data-resizer
        className={
          'absolute top-0 left-1/2 -translate-x-1/2 w-16 h-2 mt-1 rounded-xl bg-primary-100 cursor-ns-resize opacity-100 hover:bg-primary-200'
        }
      />
      <div className='h-full overflow-auto'>{children}</div>
    </div>
  );
};

export default ResizableTabContainer;
