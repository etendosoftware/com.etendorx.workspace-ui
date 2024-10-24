import { useCallback } from 'react';
import Table from '@workspaceui/componentlibrary/components/Table';
import { mockOrganizations } from '@workspaceui/storybook/mocks';
import { useRecordContext } from '../../hooks/useRecordContext';
import { EnhancedTableProps } from '@workspaceui/componentlibrary/components/Table';
import { useRouter } from 'next/navigation';

const TableView = () => {
  const { setSelectedRecord } = useRecordContext();
  const navigate = useRouter().push;

  const handleRowClick = useCallback<EnhancedTableProps['onRowClick']>(
    row => {
      const _selectedItem = mockOrganizations.find(item => item.id.value === row.original.id);
      if (_selectedItem) {
        setSelectedRecord(_selectedItem);
      }
    },
    [setSelectedRecord],
  );

  const handleRowDoubleClick = useCallback<EnhancedTableProps['onRowDoubleClick']>(
    row => {
      navigate(`${row.original.id}`);
    },
    [navigate],
  );

  return (
    <Table
      data={mockOrganizations}
      isTreeStructure={false}
      onRowClick={handleRowClick}
      onRowDoubleClick={handleRowDoubleClick}
    />
  );
};

export default TableView;
