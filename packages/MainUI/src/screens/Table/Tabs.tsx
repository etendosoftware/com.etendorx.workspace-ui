import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '../../../../ComponentLibrary/src/components';
import { useRecordContext } from '../../hooks/useRecordContext';
import DynamicTable from '../../components/DynamicTable';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Content({ tab }: { tab: Tab }) {
  const { selectRecord } = useRecordContext();
  const navigate = useNavigate();

  const handleSelect = useCallback(
    (record: unknown) => {
      selectRecord(record, tab.level);
    },
    [selectRecord, tab.level],
  );

  const handleDoubleClick = useCallback(
    (record: any) => {
      selectRecord(record, tab.level);
      navigate(record.id);
    },
    [navigate, selectRecord, tab.level],
  );

  return (
    <DynamicTable
      tab={tab}
      onSelect={handleSelect}
      onDoubleClick={handleDoubleClick}
    />
  );
}

export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const theme = useTheme();
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

  const buttonSx = (tab: Tab, activeKey: string) => ({
    color:
      tab.id === activeKey
        ? theme.palette.text.primary
        : theme.palette.text.secondary,
    backgroundColor:
      tab.id === activeKey
        ? theme.palette.primary.contrastText
        : theme.palette.background.paper,
  });

  if (!active) {
    return null;
  }

  return (
    <div>
      <div>
        {tabs.map(tab => (
          <Button
            key={tab.id}
            onClick={refs.current[tab.id]}
            sx={buttonSx(tab, activeKey)}>
            {tab._identifier}
          </Button>
        ))}
      </div>
      <Content tab={active} />
    </div>
  );
}
