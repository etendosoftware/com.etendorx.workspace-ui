import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { Box, Paper } from '@mui/material';
import TabContainer from './TabContainer';
import { styles } from './styles';
import type { ResizableTabContainerProps } from './types';

const ResizableTabContainer: React.FC<ResizableTabContainerProps> = React.memo(
  ({ isOpen, onClose, selectedRecord, onHeightChange }) => {
    const [containerHeight, setContainerHeight] = useState(40);
    const containerRef = useRef<HTMLDivElement>(null);
    const resizerRef = useRef<HTMLDivElement>(null);
    const [isFullSize, setIsFullSize] = useState(false);
    const MAX_HEIGHT = 94;

    const handleHeightChange = useCallback(
      (newHeight: number) => {
        setContainerHeight(newHeight);
        setIsFullSize(newHeight === MAX_HEIGHT);
        if (onHeightChange) {
          onHeightChange(newHeight);
        }
      },
      [onHeightChange],
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
        e.preventDefault();
        const startY =
          'clientY' in e
            ? e.clientY
            : (e as React.MouseEvent<HTMLDivElement>).clientY;
        const startHeight = containerHeight;

        const handleMouseMove = (e: MouseEvent) => {
          const dy = startY - e.clientY;
          const newHeight = Math.min(
            Math.max(startHeight + (dy / window.innerHeight) * 100, 20),
            MAX_HEIGHT,
          );
          handleHeightChange(newHeight);
        };

        const handleMouseUp = () => {
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

    const handleNativeMouseDown = useCallback(
      (e: MouseEvent) => {
        handleMouseDown(e);
      },
      [handleMouseDown],
    );

    useEffect(() => {
      const resizer = resizerRef.current;
      if (resizer) {
        resizer.addEventListener('mousedown', handleNativeMouseDown);
      }
      return () => {
        if (resizer) {
          resizer.removeEventListener('mousedown', handleNativeMouseDown);
        }
      };
    }, [handleNativeMouseDown]);

    const handleDoubleClick = useCallback(() => {
      const newHeight = containerHeight === MAX_HEIGHT ? 40 : MAX_HEIGHT;
      handleHeightChange(newHeight);
    }, [containerHeight, handleHeightChange]);

    const paperStyle = useMemo(
      () => ({
        ...styles.paper,
        height: `${containerHeight}vh`,
        transform: `translateY(${isOpen ? '0' : '100%'})`,
      }),
      [containerHeight, isOpen],
    );

    return (
      <Paper elevation={4} ref={containerRef} sx={paperStyle}>
        <Box
          ref={resizerRef}
          onMouseDown={handleMouseDown}
          sx={styles.resizer}
        />
        <Box
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          sx={styles.container}>
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
