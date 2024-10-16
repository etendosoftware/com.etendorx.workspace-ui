import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TabItem } from '@workspaceui/componentlibrary/components/PrimaryTab/types';
import { Box } from '@workspaceui/componentlibrary/components';
import PrimaryTabs from '@workspaceui/componentlibrary/components/PrimaryTab';
import { defaultIcon } from '../../constants/iconConstants';
import type { WindowMetadata } from '@workspaceui/etendohookbinder/api/types';
import { useSingleDatasource } from '@workspaceui/etendohookbinder/hooks/useSingleDatasource';
import Spinner from '@workspaceui/componentlibrary/components/Spinner';
import { Typography } from '@mui/material';
import { FormBuilder } from './FormBuilder';
import { useMetadataContext } from '../../hooks/useMetadataContext';

export function DynamicFormView({ windowData }: { windowData: WindowMetadata }) {
  const { recordId = '' } = useParams<{ recordId: string }>();
  const { record } = useSingleDatasource(windowData.tabs[0].entityName, recordId);
  const { currentTab } = useMetadataContext();

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

        if (field.displayed && !field.shownInStatusBar) {
          groups[field.fieldGroup].fields.push(field);
        }
      }
    }

    const res = Object.values(sections);

    return res;
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  const fields = useMemo(() => Object.values(currentTab?.fields || {}), [currentTab?.fields]);

  if (!record || !currentTab?.fields) {
    return <Spinner />;
  }

  return (
    <Box display="flex" flexDirection="column" height="100%" width="100%" padding="0 0.5rem 0.5rem 0.5rem">
      <Box flexShrink={1}>
        <PrimaryTabs tabs={tabs} icon={defaultIcon} />
      </Box>
      <Box flexGrow={1} overflow="auto">
        <form onSubmit={handleSubmit}>
          <Box bgcolor="white" borderRadius={1} padding={2} marginY={1} display="flex" flexDirection="column">
            <Typography fontSize="1rem" borderBottom="1px solid #ddd" paddingBottom={1} marginBottom={2}>
              Form Fields
            </Typography>
            <Box fontSize="0.8rem">
              <FormBuilder fields={fields} record={record} />
            </Box>
          </Box>
        </form>
      </Box>
    </Box>
  );
}
