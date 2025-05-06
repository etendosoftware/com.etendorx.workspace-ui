'use client';

import { ErrorDisplay } from '@/components/ErrorDisplay';
import { TabLevel } from '@/components/TabLevel';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import Tabs from '@/screens/Window/Table/Tabs';

export default function Page() {
  const { loading, window, error, groupedTabs } = useMetadataContext();

  if (loading) {
    return <div>Cargando!!!</div>;
  } else if (error || !window) {
    return <ErrorDisplay title={error?.message ?? 'Something went wrong'} />;
  } else {
    return (
      <div className="flex flex-col overflow-hidden">
        {groupedTabs.map(tabs => {
          if (tabs.length === 1) {
            return <TabLevel tab={tabs[0]} key={tabs[0].id} />;
          } else {
            return null;
            return <Tabs tabs={tabs} level={tabs[0].level}  key={tabs[0].id} />;
          }
        })}
      </div>
    );
  }
}
