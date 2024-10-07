import { useRef, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { styles } from '../styles';
import { Tooltip } from '@mui/material';
import { MenuTitleProps } from '../types';

export default function MenuTitle({
  item,
  onClick,
  selected,
  expanded,
  open,
}: MenuTitleProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTextTruncated, setIsTextTruncated] = useState(false);

  useEffect(() => {
    const checkTextTruncation = () => {
      if (textRef.current) {
        setIsTextTruncated(
          textRef.current.scrollWidth > textRef.current.clientWidth,
        );
      }
    };

    checkTextTruncation();
    window.addEventListener('resize', checkTextTruncation);
    return () => window.removeEventListener('resize', checkTextTruncation);
  }, [item.name]);

  return (
    <Box
      onClick={onClick}
      sx={{
        ...styles.listItemButton,
        ...styles.listItemContentText,
        ...(selected ? styles.listItemButtonSelected : undefined),
        ...(open ? undefined : styles.iconsClosed),
      }}>
      <div style={styles.listItemInnerContentText}>
        <Typography sx={styles.listItemText}>
          {item.icon ? <span>{item.icon}</span> : null}
          {open && (
            <Tooltip
              title={item.name}
              arrow
              disableHoverListener={!isTextTruncated}>
              <span ref={textRef} style={styles.tooltipTruncation}>
                {item.name}
              </span>
            </Tooltip>
          )}
        </Typography>
      </div>
      {open && item.children && (expanded ? <ExpandLess /> : <ExpandMore />)}
    </Box>
  );
}
