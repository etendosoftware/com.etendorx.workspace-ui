'use client';

import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChevronUp from '@workspaceui/componentlibrary/src/assets/icons/chevron-up.svg';
import ChevronDown from '@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg';

export default function Collapsible({
  title,
  children,
  initialState,
}: React.PropsWithChildren<{ title: string; initialState?: boolean }>) {
  const [isOpen, setIsOpen] = useState(initialState);
  const contentRef = useRef<React.ElementRef<'div'>>(null);
  const [maxHeight, setMaxHeight] = useState<CSSProperties['maxHeight']>('100%');
  const style = useMemo(() => ({ maxHeight: isOpen ? maxHeight : 0 }), [isOpen, maxHeight]);
  const handleToggle = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    if (contentRef.current) {
      setMaxHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen]);

  return (
    <div className={`bg-gray-100 rounded-2xl ${isOpen ? 'overflow-visible' : 'overflow-hidden'}`}>
      <div className="w-full flex justify-between items-center p-4 cursor-pointer h-12" onClick={handleToggle}>
        <span className="font-semibold">{title}</span>
        {isOpen ? <ChevronUp className="fill-current" /> : <ChevronDown size={20} className="fill-current" />}
      </div>
      <div ref={contentRef} className={`transition-all`} style={style}>
        <div className="p-4 bg-white rounded-b-2xl">{children}</div>
      </div>
    </div>
  );
}
