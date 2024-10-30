import React, { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import { Box, Paper } from '@mui/material';
import TabContainer from './TabContainer';
import { useStyle } from './styles';
import type { ResizableTabContainerProps } from './types';

const MAX_HEIGHT = 94;
const MIN_HEIGHT = 20;
const DEFAULT_HEIGHT = 40;

const ResizableTabContainer: React.FC<ResizableTabContainerProps> = memo(
  ({ isOpen, onClose, selectedRecord, onHeightChange }) => {
    const [containerHeight, setContainerHeight] = useState(DEFAULT_HEIGHT);
    const containerRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);

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

    const { sx } = useStyle();

    const [isFullSize, setIsFullSize] = useState(false);

    const paperStyle = useMemo(
      () => ({
        ...sx.paper,
        height: `${containerHeight}vh`,
        transform: `translateY(${isOpen ? '0' : '100%'})`,
      }),
      [containerHeight, isOpen, sx.paper],
    );

    return (
      <Paper elevation={4} ref={containerRef} sx={paperStyle}>
        <Box data-resizer sx={sx.resizer} />
        <Box onMouseDown={handleMouseDown} onDoubleClick={handleDoubleClick} sx={sx.container}>
          <TabContainer
            isOpen={isOpen}
            onClose={onClose}
            selectedRecord={selectedRecord}
            handleFullSize={handleDoubleClick}
            isFullSize={isFullSize}
          />
        </Box>
      </Paper>
    );
  },
);

export default ResizableTabContainer;
