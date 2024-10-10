import { useCallback, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TabItem } from '@workspaceui/componentlibrary/components/PrimaryTab/types';
import { Box, Grid } from '@workspaceui/componentlibrary/components';
import PrimaryTabs from '@workspaceui/componentlibrary/components/PrimaryTab';
import { defaultIcon } from '../../constants/iconConstants';
import { WindowMetadata } from '@workspaceui/etendohookbinder/api/types';
import useFormRecord from '../../hooks/useFormRecord';

export function DynamicFormView({ windowData }: { windowData: WindowMetadata }) {
  const { recordId = '' } = useParams<{ recordId: string }>();
  const record = useFormRecord(windowData.tabs[0].entityName, recordId);
  const [selectedTab, setSelectedTab] = useState(windowData.tabs[0].id);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentTab = useMemo(() => windowData.tabs.find(tab => selectedTab === tab.id), [selectedTab, windowData.tabs]);

  const [tabs] = useState<TabItem[]>(() => {
    if (!currentTab) {
      return [];
    }

    const sections = Object.entries(currentTab.fields).reduceRight(
      (acc, [, field]) => {
        acc[field.fieldGroup ?? ''] = {
          label: field.fieldGroup$_identifier ?? '',
          id: field.fieldGroup ?? '',
          showInTab: 'both',
        };

        return acc;
      },
      {} as Record<string, TabItem>,
    );

    const res = Object.values(sections);

    console.debug(res);

    return res;
  });

  const handleTabChange = useCallback((newTabId: string) => {
    setSelectedTab(newTabId);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  return (
    <Box display="flex" flexDirection="column" height="100%" width="100%" padding="0 0.5rem 0.5rem 0.5rem">
      <Box flexShrink={1}>
        <PrimaryTabs tabs={tabs} onChange={handleTabChange} icon={defaultIcon} />
      </Box>
      <Box flexGrow={1} overflow="auto" ref={containerRef}>
        <form onSubmit={handleSubmit}>
          <Grid container>{JSON.stringify(record, null, 2)}</Grid>
        </form>
      </Box>
    </Box>
  );
}
