import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TabItem } from '@workspaceui/componentlibrary/components/PrimaryTab/types';
import { Box } from '@workspaceui/componentlibrary/components';
import PrimaryTabs from '@workspaceui/componentlibrary/components/PrimaryTab';
import { defaultIcon } from '../../constants/iconConstants';
import { WindowMetadata } from '@workspaceui/etendohookbinder/api/types';
import { useSingleDatasource } from '@workspaceui/etendohookbinder/hooks/useSingleDatasource';

export function DynamicFormView({ windowData }: { windowData: WindowMetadata }) {
  const { recordId = '' } = useParams<{ recordId: string }>();
  const { record } = useSingleDatasource(windowData.tabs[0].entityName, recordId);
  const [selectedTab, setSelectedTab] = useState(windowData.tabs[0].id);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentTab = useMemo(() => windowData.tabs.find(tab => selectedTab === tab.id), [selectedTab, windowData.tabs]);

  useEffect(() => {
    const f = currentTab?.fields;

    if (f) {
      Object.entries(f).forEach(([fieldName, field]) => {
        console.debug({ [fieldName]: field });
      });
    }
  }, [currentTab?.fields]);

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

    const groups = {} as Record<string, { fields: unknown[]; position: number; identifier: string; id: string }>;
    let position = 0;

    for (const fieldName in currentTab.fields) {
      if (Object.prototype.hasOwnProperty.call(currentTab.fields, fieldName)) {
        const field = currentTab.fields[fieldName];

        if (!groups[field.fieldGroup]) {
          position = position + 1;
          groups[field.fieldGroup] = {
            id: field.fieldGroup,
            identifier: field.fieldGroup$_identifier,
            position,
            fields: [],
          };
        }
        groups[field.fieldGroup].fields.push(field);
      }
    }

    const res = Object.values(sections);

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
        <form onSubmit={handleSubmit}></form>
      </Box>
    </Box>
  );
}
