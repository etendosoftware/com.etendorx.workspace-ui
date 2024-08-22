import React from 'react';
import { Table } from '@workspaceui/componentlibrary/src/components';

const TableView: React.FC<{
  data;
  onRowClick: (row) => void;
  onRowDoubleClick: (row) => void;
}> = ({ data, onRowClick, onRowDoubleClick }) => (
  <Table
    data={data}
    isTreeStructure={false}
    onRowClick={onRowClick}
    onRowDoubleClick={onRowDoubleClick}
  />
);

export default TableView;
