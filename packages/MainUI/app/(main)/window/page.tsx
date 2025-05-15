'use client';

import Tabs from '@/components/window/Tabs';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import Loading from '@/components/loading';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import { SelectedProvider } from '@/contexts/selected';

export default function Page() {
  const { loading, window, error, groupedTabs } = useMetadataContext();

  if (loading) {
    return <Loading />;
  } else if (error || !window) {
    return <ErrorDisplay title={error?.message ?? 'Something went wrong'} />;
  } else {
    return (
      <SelectedProvider tabs={window.tabs}>
        <div className="flex flex-col w-full h-full max-h-full">
          {groupedTabs.map(tabs => {
            return <Tabs key={tabs[0].id} tabs={tabs} />;
          })}
        </div>
      </SelectedProvider>
    );
  }
}
