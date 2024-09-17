import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '../../../../ComponentLibrary/src/components';
import { useRecordContext } from '../../hooks/useRecordContext';
import DynamicTable from '../../components/DynamicTable';

function Content({ tab }: { tab: Tab }) {
  const { selectRecord } = useRecordContext();

  const handleSelect = useCallback(
    (record: unknown) => {
      selectRecord(record, tab.level);
    },
    [selectRecord, tab.level],
  );

  return <DynamicTable tab={tab} onSelect={handleSelect} />;
}

export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const [activeKey, setActiveKey] = useState(tabs[0].id);

  const refs = useRef(
    tabs.reduce(
      (acum, current) => {
        acum[current.id] = () => setActiveKey(current.id);

        return acum;
      },
      {} as Record<string, () => void>,
    ),
  );

  const active = useMemo(
    () => tabs.find(tab => tab.id === activeKey) as Tab,
    [activeKey, tabs],
  );

  if (!active) {
    return null;
  }

  return (
    <div>
      <div>
        {tabs.map(tab => (
          <Button
            onClick={refs.current[tab.id]}
            sx={{
              backgroundColor: activeKey === tab.id ? 'white' : 'transparent',
            }}>
            {tab._identifier}
          </Button>
        ))}
      </div>
      <Content tab={active} />
    </div>
  );
}
