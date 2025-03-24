'use client';

import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChevronUp from '@workspaceui/componentlibrary/src/assets/icons/chevron-up.svg';
import ChevronDown from '@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg';
import InfoIcon from '@workspaceui/componentlibrary/src/assets/icons/file-text.svg';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';
import { defaultFill, useStyle } from './FormView/styles';
import { useTheme } from '@mui/material';

export default function Collapsible({
  title,
  icon,
  children,
  initialState = false,
  onHover = () => {},
  sectionId,
  isHovered = false,
}: React.PropsWithChildren<{
  title: string;
  icon?: React.ReactNode;
  initialState?: boolean;
  onHover?: (sectionName: string | null) => void;
  sectionId?: string;
  isHovered?: boolean;
}>) {
  const { sx } = useStyle();
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(initialState);
  const contentRef = useRef<React.ElementRef<'div'>>(null);
  const [maxHeight, setMaxHeight] = useState<CSSProperties['maxHeight']>('100%');
  const style = useMemo(() => ({ maxHeight: isOpen ? maxHeight : 0 }), [isOpen, maxHeight]);

  const handleToggle = useCallback(() => setIsOpen(prev => !prev), []);
  const handleMouseEnter = useCallback(() => onHover(title), [onHover, title]);
  const handleMouseLeave = useCallback(() => onHover(null), [onHover]);

  const iconButtonStyle = useMemo(
    () => ({
      background: isHovered ? theme.palette.dynamicColor.main : theme.palette.dynamicColor.contrastText,
      '&:hover': {
        background: theme.palette.dynamicColor.main,
      },
    }),
    [isHovered, theme.palette.dynamicColor],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleToggle();
        e.preventDefault();
      }
    },
    [handleToggle],
  );

  useEffect(() => {
    if (!contentRef.current) return;

    const focusableElements = contentRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    focusableElements.forEach(el => {
      if (isOpen) {
        if ((el as HTMLElement).dataset.originalTabIndex) {
          (el as HTMLElement).setAttribute('tabindex', (el as HTMLElement).dataset.originalTabIndex || '0');
          delete (el as HTMLElement).dataset.originalTabIndex;
        }
      } else {
        if (!(el as HTMLElement).dataset.originalTabIndex) {
          (el as HTMLElement).dataset.originalTabIndex = (el as HTMLElement).getAttribute('tabindex') || '0';
        }
        (el as HTMLElement).setAttribute('tabindex', '-1');
      }
    });
  }, [isOpen]);

  useEffect(() => {
    if (contentRef.current) {
      setMaxHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen, children]);

  return (
    <div
      id={`section-${sectionId}`}
      className={`bg-white rounded-xl border border-gray-200 mb-4 ${isOpen ? 'overflow-visible' : 'overflow-hidden'}`}>
      <div
        className={`w-full h-12 flex justify-between items-center p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
          isOpen ? 'rounded-xl' : ''
        }`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>
        <div className="flex items-center gap-3">
          <IconButton fill={defaultFill} sx={iconButtonStyle} height={16} width={16} isHovered={isHovered}>
            {icon || <InfoIcon />}
          </IconButton>
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        <div>
          <IconButton size="small" sx={sx.chevronButton} hoverFill={theme.palette.baselineColor.neutral[80]}>
            {isOpen ? <ChevronUp /> : <ChevronDown />}
          </IconButton>
        </div>
      </div>
      <div ref={contentRef} className={`transition-all duration-300 ease-in-out`} style={style}>
        <div className="p-4">
          {React.isValidElement(children) && children.type === 'div' ? children : <div>{children}</div>}
        </div>
      </div>
    </div>
  );
}
