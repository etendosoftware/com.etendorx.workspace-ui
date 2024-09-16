import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useMemo, useRef, useState } from 'react';
import { Button } from '../../../../ComponentLibrary/src/components';
import DynamicTable from '@workspaceui/componentlibrary/src/components/DynamicTable';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { parseColumns } from '@workspaceui/etendohookbinder/src/helpers/metadata';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';

function Content({ tab }: { tab: Tab }) {
  const { records, loading, error, fetchMore, loaded } = useDatasource(tab, {
    sortBy: 'documentNo',
    operator: 'or',
    criteria: [
      {
        fieldName: 'documentNo',
        operator: 'iContains',
        value: '100',
      },
      {
        fieldName: 'active',
        operator: 'equals',
        value: 'true',
      },
    ],
  });

  if (loading && !loaded) {
    return <Spinner />;
  } else if (error) {
    return <div>{error.message}</div>;
  } else {
    return (
      <DynamicTable
        columns={parseColumns(Object.values(tab.fields))}
        data={records}
        fetchMore={fetchMore}
        loading={loading}
      />
    );
  }
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
