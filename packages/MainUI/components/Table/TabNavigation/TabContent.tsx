import React, { useMemo } from 'react';
import { TabContentProps } from './types';
import ChevronUp from '../../../../ComponentLibrary/src/assets/icons/chevron-up.svg';
import ChevronDown from '../../../../ComponentLibrary/src/assets/icons/chevron-down.svg';
import ChevronUpRight from '../../../../ComponentLibrary/src/assets/icons/chevron-right.svg';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import TabsGroup from '@/screens/Table/TabsGroup';

export const TabContent: React.FC<TabContentProps> = ({ identifier, type, handleFullSize, isFullSize, tab }) => {
  const { groupedTabs } = useMetadataContext();

  const childTabs = useMemo(() => {
    if (!tab) return [];
    return groupedTabs.find(tabs => tabs[0].level === tab.level + 1) || [];
  }, [groupedTabs, tab]);

  return (
    <div className="flex flex-col h-full">
      <div
        className="h-11 min-h-[44px] flex justify-between items-center px-4 rounded-t-lg sticky top-0 z-10 w-full flex-shrink-0 cursor-ns-resize"
        style={{
          borderBottom: '1px solid var(--transparent-neutral-10, rgba(0,3,13,0.1))',
          backgroundColor: 'var(--transparent-neutral-5, rgba(0,3,13,0.05))',
        }}>
        <div className="flex items-center overflow-hidden">
          <div
            className="flex items-center px-2 rounded-full h-8 flex-shrink-0"
            style={{
              backgroundColor: 'var(--transparent-neutral-5, rgba(0,3,13,0.05))',
              border: '1px solid var(--transparent-neutral-10, rgba(0,3,13,0.1))',
            }}>
            <p className="text-sm whitespace-nowrap">{type}</p>
          </div>
          <div className="ml-2 min-w-8 overflow-hidden">
            <p
              className="truncate"
              style={{
                color: 'var(--baseline-neutral-100, #00030D)',
                fontWeight: 600,
                fontSize: '1.25rem',
              }}>
              {identifier}
            </p>
          </div>
        </div>
        <div className="flex items-center flex-shrink-0">
          <IconButton onClick={handleFullSize} size="small" className="bg-transparent">
            {isFullSize ? <ChevronDown /> : <ChevronUp />}
          </IconButton>
          <IconButton size="small" className="bg-transparent">
            <ChevronUpRight />
          </IconButton>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        {childTabs.length > 0 ? (
          TabsGroup(childTabs)
        ) : (
          <div className="p-4 text-center" style={{ color: 'var(--baseline-neutral-70, #3F4A7E)' }}>
            No child tabs available for this record
          </div>
        )}
      </div>
    </div>
  );
};

export default TabContent;
