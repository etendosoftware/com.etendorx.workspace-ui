'use client';

import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChevronUp from '@workspaceui/componentlibrary/src/assets/icons/chevron-up.svg';
import ChevronDown from '@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg';
import InfoIcon from '@workspaceui/componentlibrary/src/assets/icons/file-text.svg';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';
import { defaultFill, useStyle } from './FormView/styles';
import { useTheme } from '@mui/material';
import { CollapsibleProps } from './FormView/types';

export default function Collapsible({
  title,
  icon,
  children,
  initialState = false,
  onHover = () => {},
  sectionId,
  isHovered = false,
  onToggle,
}: CollapsibleProps) {
  const { sx } = useStyle();
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(initialState);
  const contentRef = useRef<React.ElementRef<'div'>>(null);
  const [maxHeight, setMaxHeight] = useState<CSSProperties['maxHeight']>('100%');
  const style = useMemo(() => ({ maxHeight: isOpen ? maxHeight : 0 }), [isOpen, maxHeight]);

  useEffect(() => {
    setIsOpen(initialState);
  }, [initialState]);

  const handleToggle = useCallback(() => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (onToggle) {
      onToggle(newIsOpen);
    }
  }, [isOpen, onToggle]);

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

  useEffect(() => {
    if (contentRef.current) {
      setMaxHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen, children]);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleToggle();
        e.preventDefault();
      }
    },
    [handleToggle],
  );

  return (
    <div
      id={`section-${sectionId}`}
      className={`bg-white rounded-xl border border-gray-200 mb-4 ${isOpen ? 'overflow-visible' : 'overflow-hidden'}`}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={`section-content-${sectionId}`}
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
      <div
        id={`section-content-${sectionId}`}
        ref={contentRef}
        className={`transition-all duration-300 ease-in-out ${isOpen ? '' : 'pointer-events-none'}`}
        style={{
          ...style,
          visibility: isOpen ? 'visible' : 'hidden',
        }}
        aria-hidden={!isOpen}>
        <div className="p-4">
          {React.isValidElement(children) && children.type === 'div' ? children : <div>{children}</div>}
        </div>
      </div>
    </div>
  );
}
