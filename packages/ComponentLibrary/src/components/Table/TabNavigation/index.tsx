import { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Paper } from '@mui/material';
import TabContainer from './TabContainer';
import { resizableTabContainerStyles as styles } from '../styles';
import type { ResizableTabContainerProps } from '../../../../../storybook/src/stories/Components/Table/types';

const ResizableTabContainer: React.FC<ResizableTabContainerProps> = ({
  isOpen,
  onClose,
  selectedRecord,
  onHeightChange,
}) => {
  const [containerHeight, setContainerHeight] = useState(40);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const [isFullSize, setIsFullSize] = useState(false);
  const MAX_HEIGHT = 93;

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
        setContainerHeight(newHeight);
        onHeightChange(newHeight);
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
    [containerHeight, onHeightChange],
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
    setContainerHeight(newHeight);
    setIsFullSize(newHeight === MAX_HEIGHT);
    onHeightChange(newHeight);
  }, [containerHeight, onHeightChange]);

  return (
    <Paper
      elevation={4}
      ref={containerRef}
      sx={{
        ...styles.paper,
        height: `${containerHeight}vh`,
        transform: `translateY(${isOpen ? '0' : '100%'})`,
      }}>
      <Box ref={resizerRef} onMouseDown={handleMouseDown} sx={styles.resizer} />
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
};

export default ResizableTabContainer;
