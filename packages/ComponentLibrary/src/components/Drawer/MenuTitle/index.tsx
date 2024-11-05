import { useState, useEffect } from 'react';
import { SxProps, Theme, Tooltip, Box, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { MenuTitleProps } from '../types';
import { useStyle } from '../styles';

export default function MenuTitle({ item, onClick, selected, expanded, open }: MenuTitleProps) {
  const [isTextTruncated, setIsTextTruncated] = useState(false);
  const { sx } = useStyle();

  useEffect(() => {
    const checkTextTruncation = () => {
      const text = document.getElementById(item.id);

      if (text) {
        setIsTextTruncated(text.scrollWidth > text.clientWidth);
      }
    };

    checkTextTruncation();
    window.addEventListener('resize', checkTextTruncation);
    return () => window.removeEventListener('resize', checkTextTruncation);
  }, [item.id]);

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
              <span style={tooltipStyles} id={item.id}>
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
