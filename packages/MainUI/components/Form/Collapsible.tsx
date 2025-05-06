'use client';

import React, { CSSProperties, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChevronUp from '@workspaceui/componentlibrary/src/assets/icons/chevron-up.svg';
import ChevronDown from '@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg';
import InfoIcon from '@workspaceui/componentlibrary/src/assets/icons/file-text.svg';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';
import { useStyle } from './FormView/styles';
import { useTheme } from '@mui/material';
import { CollapsibleProps } from './FormView/types';

function CollapsibleCmp({ title, icon, children, isExpanded, sectionId, onToggle }: CollapsibleProps) {
  const { sx } = useStyle();
  const theme = useTheme();
  const contentRef = useRef<React.ElementRef<'div'>>(null);
  const [maxHeight, setMaxHeight] = useState<CSSProperties['maxHeight']>('100%');
  const style = useMemo(() => ({ maxHeight: isExpanded ? maxHeight : 0 }), [isExpanded, maxHeight]);

  const handleToggle = useCallback(() => {
    if (onToggle) {
      onToggle(!isExpanded);
    }
  }, [isExpanded, onToggle]);

  useEffect(() => {
    if (contentRef.current) {
      setMaxHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded, children]);

  useEffect(() => {
    if (!contentRef.current) return;

    const focusableElements = contentRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    focusableElements.forEach(el => {
      if (isExpanded) {
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
  }, [isExpanded]);

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
      className={`bg-white rounded-xl border border-gray-200 mb-4 ${isExpanded ? 'overflow-visible' : 'overflow-hidden'}`}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`section-content-${sectionId}`}
        className={`w-full h-12 flex justify-between text-(--color-baseline-90) hover:text-(--color-dynamic-main)
          items-center p-4 cursor-pointer transition-colors hover:bg-(--color-dynamic-contrast-text) bg-gray-50 ${isExpanded ? 'rounded-xl' : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}>
        <div className="flex items-center gap-3 ">
          {(icon && false) || <InfoIcon fill="currentColor" />}
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        <div>
          <IconButton size="small" sx={sx.chevronButton} hoverFill={theme.palette.baselineColor.neutral[80]}>
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </IconButton>
        </div>
      </div>
      <div
        id={`section-content-${sectionId}`}
        ref={contentRef}
        className={`transition-all duration-300 ease-in-out ${isExpanded ? '' : 'pointer-events-none'}`}
        style={{
          ...style,
          visibility: isExpanded ? 'visible' : 'hidden',
        }}
        aria-hidden={!isExpanded}>
        <div className="p-4">
          {React.isValidElement(children) && children.type === 'div' ? children : <div>{children}</div>}
        </div>
      </div>
    </div>
  );
}

export const Collapsible = memo(CollapsibleCmp);
export default Collapsible;
