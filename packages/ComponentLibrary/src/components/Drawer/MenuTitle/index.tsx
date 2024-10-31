import { useRef, useState, useEffect } from 'react';
import { SxProps, Theme, Tooltip, Box, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import useStyle from '../styles';
import { MenuTitleProps } from '../types';

export default function MenuTitle({ item, onClick, selected, expanded, open }: MenuTitleProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTextTruncated, setIsTextTruncated] = useState(false);
  const { sx } = useStyle();

  useEffect(() => {
    const checkTextTruncation = () => {
      if (textRef.current) {
        setIsTextTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
      }
    };

    checkTextTruncation();
    window.addEventListener('resize', checkTextTruncation);
    return () => window.removeEventListener('resize', checkTextTruncation);
  }, [item.name]);

  const boxStyles: SxProps<Theme> = {
    ...(sx.listItemButton as object),
    ...(sx.listItemContentText as object),
    ...(selected ? (sx.listItemButtonSelected as object) : {}),
    ...(open ? {} : (sx.iconsClosed as object)),
  };

  const tooltipStyles = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const innerContentStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    justifyContent: 'flex-start',
  };

  return (
    <Box onClick={onClick} sx={boxStyles}>
      <div style={innerContentStyles}>
        <Typography sx={sx.listItemText}>
          {item.icon ? <span>{item.icon}</span> : null}
          {open && (
            <Tooltip title={item.name} arrow disableHoverListener={!isTextTruncated}>
              <span ref={textRef} style={tooltipStyles}>
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
