'use client';

import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useMetadataContext } from '../../../../../hooks/useMetadataContext';
import Tabs from '../../../../../screens/Table/Tabs';

function Level(value: Tab[]) {
  return <Tabs key={value[0].id} tabs={value} />;
}

export default function DynamicTableScreen() {
  const { loading, error, windowData, groupedTabs } = useMetadataContext();

  if (loading) {
    return <Spinner />;
  } else if (error || !windowData) {
    return <div>{error?.message ?? 'Something went wrong'}</div>;
  } else {
    return <div>{groupedTabs.map(tabs => Level(tabs))}</div>;
  }
}
