'use client';

import React, { useRef } from 'react';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { MenuTitleProps } from '../types';

const MenuTitle: React.FC<MenuTitleProps> = React.memo(({ item, onClick, selected, expanded, open, popperOpen }) => {
  const textRef = useRef<HTMLSpanElement>(null);

  return (
    <div
      onClick={onClick}
      className={`flex items-center transition-colors duration-300 cursor-pointer
        ${
          open
            ? `rounded-lg text-xl justify-between p-1 gap-1 ${
                selected
                  ? 'bg-dynamic-main text-neutral-50 hover:bg-neutral-90'
                  : 'text-neutral-90 hover:bg-dynamic-main hover:text-neutral-50 hover:text-neutral-0'
              }`
            : 'hover:bg-dynamic-main rounded-full justify-center items-center w-9 h-9 p-0'
        }
      `}>
      <div className={`flex items-center ${open ? 'overflow-hidden' : ''}`}>
        <div className={`${open ? 'w-8' : 'w-full h-full'} flex justify-center items-center`}>
          {item.icon || (
            <span className="text-base">
              {item.type === 'Report'
                ? '📊'
                : item.type === 'ProcessDefinition' || item.type === 'ProcessManual'
                  ? '⚙️'
                  : '📁'}
            </span>
          )}
        </div>
        {open && (
          <div className="relative group flex items-center py-1.5">
            <span
              ref={textRef}
              className="ml-2 font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-40">
              {item.name}
            </span>
          </div>
        )}
      </div>
      {open && item.children && !popperOpen && (
        <div className={`transition-transform duration-300 flex justify-center ${expanded ? 'rotate-180' : ''}`}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </div>
      )}
    </div>
  );
});

MenuTitle.displayName = 'MenuTitle';

export default MenuTitle;
