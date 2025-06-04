import { useCallback, useEffect, useRef, useState } from "react";
import { useThrottle } from "../../hooks/useThrottle";

interface ResizeHandleProps {
  onHeightChange: (height: number) => void;
  initialHeight?: number;
  minHeight?: number;
  maxOffsetRem?: number;
}

const ResizeHandle = ({ 
  onHeightChange, 
  initialHeight = 50,
  minHeight = 20,
  maxOffsetRem = 9
}: ResizeHandleProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentHeight, setCurrentHeight] = useState(initialHeight);
  const startY = useRef(0);
  const startHeight = useRef(0); 

  const calculateHeightLimits = useCallback(() => {
    const remInPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const maxHeightPx = window.innerHeight - (maxOffsetRem * remInPx);
    const maxHeightPercentage = (maxHeightPx / window.innerHeight) * 100;
    
    return {
      min: minHeight,
      max: Math.max(maxHeightPercentage, minHeight) 
    };
  }, [minHeight, maxOffsetRem]);

  const throttledWindowResize = useThrottle(useCallback(() => {
    const { min, max } = calculateHeightLimits();
    if (currentHeight > max) {
      const clampedHeight = max;
      setCurrentHeight(clampedHeight);
      onHeightChange(clampedHeight);
    } else if (currentHeight < min) {
      const clampedHeight = min;
      setCurrentHeight(clampedHeight);
      onHeightChange(clampedHeight);
    }
  }, [currentHeight, calculateHeightLimits, onHeightChange]), 250);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startY.current = e.clientY;
    startHeight.current = currentHeight; 
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, [currentHeight]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const totalDeltaY = startY.current - e.clientY;
    const percentageDelta = (totalDeltaY / window.innerHeight) * 100;
    
    const { min, max } = calculateHeightLimits();
    const newHeight = Math.min(Math.max(startHeight.current + percentageDelta, min), max);
    
    setCurrentHeight(newHeight);
    onHeightChange(newHeight);
  }, [isDragging, calculateHeightLimits, onHeightChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (!isDragging) {
      setCurrentHeight(initialHeight);
    }
  }, [initialHeight, isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    window.addEventListener('resize', throttledWindowResize);
    return () => window.removeEventListener('resize', throttledWindowResize);
  }, [throttledWindowResize]);

  return (
    <div 
      className={`
        relative h-2 cursor-ns-resize group
        flex items-center justify-center
        transition-colors duration-200
      `}
      onMouseDown={handleMouseDown}
    >
      <div className="flex space-x-1 transition-opacity duration-200">
        <div
          data-resizer
          className={`
            absolute top-0 left-1/2 -translate-x-1/2 w-16 h-2 mt-1 rounded-lg
            transition-all duration-200
            ${isDragging 
              ? 'bg-blue-400 shadow-lg scale-110' 
              : 'bg-[#B1B8D8] group-hover:bg-[#9DA8C8] group-hover:scale-105'
            }
          `}
        />
      </div>
      
      <div className="absolute inset-x-0 -inset-y-2" />
      
      {isDragging && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg pointer-events-none">
          {Math.round(currentHeight)}%
        </div>
      )}
    </div>
  );
};

export default ResizeHandle;