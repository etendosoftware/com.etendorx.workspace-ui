'use client';

import Tabs from '@/screens/Window/Table/Tabs';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import Loading from '@/components/loading';
import { useMetadataContext } from '@/hooks/useMetadataContext';

export default function Page() {
  const { loading, window, error, groupedTabs } = useMetadataContext();

  if (loading) {
    return <Loading />;
  } else if (error || !window) {
    return <ErrorDisplay title={error?.message ?? 'Something went wrong'} />;
  } else {
    return (
      <div className="w-full h-full max-h-full overflow-hidden space-y-4 p-2">
        {groupedTabs.map(tabs => {
          return <Tabs tabs={tabs} level={tabs[0].level} key={tabs[0].id} />;
        })}
      </div>
    );
  }
}
