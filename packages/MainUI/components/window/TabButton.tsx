'use client';

import { useCallback, useMemo } from 'react';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import type { TabSwitchProps } from '@/components/window/types';

export const TabButton = ({ tab, onClick, active }: TabSwitchProps) => {
  const { window } = useMetadataContext();

  const title = useMemo(() => (tab.tabLevel === 0 ? window?.name : tab.name), [tab.tabLevel, tab.name, window?.name]);

  const handleClick = useCallback(() => {
    onClick(tab);
  }, [onClick, tab]);

  return (
    <span>
      <button
        type="button"
        onClick={handleClick}
        title={title}
        aria-label={title}
        className={`px-2 py-1 w-auto font-semibold hover:bg-white transition-colors appearance-none ${tab.tabLevel === 0 ? 'text-xl' : active ? 'bg-white' : ''}`}>
        {title}
      </button>
    </span>
  );
};

export default TabButton;
