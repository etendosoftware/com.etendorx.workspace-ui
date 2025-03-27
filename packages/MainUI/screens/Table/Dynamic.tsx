import { useMemo } from 'react';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import { TabLevel } from '../../components/TabLevel';
import { ErrorDisplay } from '@/components/ErrorDisplay';

export default function DynamicTableScreen() {
  const { loading, window, error, groupedTabs } = useMetadataContext();
  const topLevelTabs = useMemo(() => groupedTabs.find(tabs => tabs[0].level === 0) || [], [groupedTabs]);

  if (loading) {
    return null;
  } else if (error || !window) {
    return <ErrorDisplay title={error?.message ?? 'Something went wrong'} />;
  } else {
    return (
      <div className="m-1 relative h-screen overflow-hidden ">
        {topLevelTabs.length > 0 && <TabLevel tab={topLevelTabs[0]} />}
      </div>
    );
  }
}
