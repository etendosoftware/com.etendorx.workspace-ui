import { useMetadataContext } from '../../hooks/useMetadataContext';
import { TabLevel } from '../../components/TabLevel';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import Tabs from './Tabs';

export default function DynamicTableScreen() {
  const { loading, window, error, groupedTabs } = useMetadataContext();

  if (loading) {
    return null;
  } else if (error || !window) {
    return <ErrorDisplay title={error?.message ?? 'Something went wrong'} />;
  } else {
    return (
      <div className="flex flex-col max-h-full overflow-hidden">
        {groupedTabs.map(tabs => {
          if (tabs.length === 1) {
            return (
              <div className="flex-1 min-h-0" key={tabs[0].id}>
                <TabLevel tab={tabs[0]} />
              </div>
            );
          } else {
            return (
              <div className="flex-1 min-h-0" key={tabs[0].id}>
                <Tabs tabs={tabs} level={tabs[0].level} />
              </div>
            );
          }
        })}
      </div>
    );
  }
}
