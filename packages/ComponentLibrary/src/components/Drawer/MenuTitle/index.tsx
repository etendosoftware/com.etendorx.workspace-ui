'use client';

import React, { useRef } from 'react';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { MenuTitleProps } from '../types';

const MenuTitle: React.FC<MenuTitleProps> = React.memo(({ item, onClick, selected, expanded, open }) => {
  const textRef = useRef<HTMLSpanElement>(null);

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center transition-colors duration-300 hover:bg-dynamic-main hover:text-neutral-50 cursor-pointer rounded-lg text-xl justify-between p-1 gap-1 ${
          selected
            ? 'bg-dynamic-main text-neutral-50 hover:bg-neutral-90'
            : 'text-neutral-90 hover:bg-dynamic-main hover:text-neutral-0'
        }
        ${!open ? 'rounded-full flex justify-center items-center max-w-9 max-h-9' : ''}
      `}>
      <div className="flex items-center overflow-hidden">
        <div className="w-8 flex justify-center">
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
      {open && item.children && (
        <div className={`transition-transform duration-300 flex justify-center ${expanded ? 'rotate-180' : ''}`}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </div>
      )}
    </div>
  );
});

MenuTitle.displayName = 'MenuTitle';

export default MenuTitle;
