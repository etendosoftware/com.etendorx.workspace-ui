'use client';

import type { TabsSwitchProps } from '@/components/window/types';
import { TabButton } from '@/components/window/TabButton';

export const SubTabsSwitch = ({ tabs, current, onClick, onClose }: TabsSwitchProps) => {
  return (
    <div className="flex items-center justify-between bg-gray-200">
      <div>
        {tabs.map(tab => (
          <TabButton key={tab.id} tab={tab} onClick={onClick} active={current.id === tab.id} />
        ))}
      </div>
      <button
        type="button"
        className="bg-baseline-60 text-white font-bold text-xs w-6 h-6 rounded-full shadow-lg"
        onClick={onClose}>
        X
      </button>
    </div>
  );
};

export default SubTabsSwitch;
