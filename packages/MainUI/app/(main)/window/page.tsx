'use client';

import { ErrorDisplay } from '@/components/ErrorDisplay';
import Loading from '@/components/loading';
import Tabs from '@/components/window/Tabs';
import { SelectedProvider } from '@/contexts/selected';
import { useMetadataContext } from '@/hooks/useMetadataContext';

export default function Page() {
  const { loading, window, error, groupedTabs } = useMetadataContext();

  if (loading) {
    return <Loading />;
  }

  if (error || !window) {
    return <ErrorDisplay title={error?.message ?? 'Something went wrong'} />;
  }

  return (
    <SelectedProvider tabs={window.tabs}>
      <div className='flex flex-col w-full h-full max-h-full'>
        {groupedTabs.map((tabs) => {
          return <Tabs key={tabs[0].id} tabs={tabs} />;
        })}
      </div>
    </SelectedProvider>
  );
}
