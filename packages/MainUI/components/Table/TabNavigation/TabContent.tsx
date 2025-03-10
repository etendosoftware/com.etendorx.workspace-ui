import React, { useMemo } from 'react';
import { TabContentProps } from './types';
import ChevronUp from '../../../../ComponentLibrary/src/assets/icons/chevron-up.svg';
import ChevronDown from '../../../../ComponentLibrary/src/assets/icons/chevron-down.svg';
import ChevronUpRight from '../../../../ComponentLibrary/src/assets/icons/chevron-right.svg';
import XCircle from '../../../../ComponentLibrary/src/assets/icons/x.svg';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import TabsGroup from '@/screens/Table/TabsGroup';

export const TabContent: React.FC<TabContentProps> = ({
  identifier,
  type,
  handleFullSize,
  isFullSize,
  tab,
  isMainTab = false,
  onClose,
}) => {
  const { groupedTabs } = useMetadataContext();

  const childTabs = useMemo(() => {
    if (!tab) return [];
    return groupedTabs.find(tabs => tabs[0].level === tab.level + 1) || [];
  }, [groupedTabs, tab]);

  const hasChildTabs = childTabs.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div
        className={`h-11 min-h-[44px] flex justify-between items-center px-4 rounded-t-xl sticky top-0 z-10 w-full flex-shrink-0 border-b border-[rgba(0,3,13,0.1)] bg-[rgba(0,3,13,0.05)]
          ${isMainTab ? 'cursor-default' : 'cursor-ns-resize'}`}>
        <div className="flex items-center overflow-hidden rounded-2xl">
          <div className="flex items-center px-2 rounded-full h-8 flex-shrink-0 bg-[rgba(0,3,13,0.05)] border border-[rgba(0,3,13,0.1)]">
            <p className="text-sm whitespace-nowrap">{type}</p>
          </div>
          <div className="ml-2 min-w-8 overflow-hidden">
            <p className="truncate text-[#00030D] font-semibold text-xl">{identifier}</p>
          </div>
        </div>
        <div className="flex items-center flex-shrink-0">
          {!isMainTab && (
            <IconButton onClick={handleFullSize} size="small" className="bg-transparent">
              {isFullSize ? <ChevronDown /> : <ChevronUp />}
            </IconButton>
          )}
          <IconButton size="small" className="bg-transparent">
            <ChevronUpRight />
          </IconButton>
          <IconButton onClick={onClose} size="small" className="bg-transparent ml-1 text-red-500 hover:text-red-700">
            <XCircle />
          </IconButton>
        </div>
      </div>

      {hasChildTabs && <div className="flex-grow overflow-y-auto">{TabsGroup(childTabs)}</div>}
    </div>
  );
};

export default TabContent;
