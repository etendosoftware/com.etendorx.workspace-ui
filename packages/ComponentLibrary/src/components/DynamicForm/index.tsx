import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { Box, TextField, Checkbox, Select, MenuItem } from '@mui/material';
import Spinner from '../Spinner';

const DynamicForm: React.FC = () => {
  const { id: windowId, recordId } = useParams<{
    id: string;
    recordId: string;
  }>();
  const {
    windowData,
    columnsData,
    loading: metadataLoading,
    error: metadataError,
  } = useWindow(windowId || '');
  const [formData, setFormData] = useState<Record<string, any>>({});

  const {
    records,
    loading: recordLoading,
    error: recordError,
  } = useDatasource(windowData, {
    criteria: [
      {
        fieldName: 'id',
        operator: 'equals',
        value: recordId,
      },
    ],
  });

  useEffect(() => {
    if (records && records.length > 0) {
      setFormData(records[0]);
    }
  }, [records]);

  console.log('Window Data:', windowData);
  console.log('Columns Data:', columnsData);
  console.log('Records:', records);

  if (metadataLoading || recordLoading) {
    return <Spinner />;
  }

  if (metadataError) {
    return <div>Error loading metadata: {metadataError.message}</div>;
  }

  if (recordError) {
    return <div>Error loading record: {recordError.message}</div>;
  }

  if (!windowData || !columnsData) {
    return <div>No metadata available</div>;
  }

  if (!records || records.length === 0) {
    return <div>No record found for ID: {recordId}</div>;
  }

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderField = (column: any) => {
    const fieldName = column.column.dBColumnName;
    const value = formData[fieldName] || '';
    const reference = column.column.reference;

    switch (reference) {
      case '19': // TableDir
      case '30': // Search
      case '18': // Table
      case '95E2A8B50A254B2AAE6774B8C2F28120': // OBUISEL_Selector Reference
        return (
          <Select
            value={value}
            onChange={e => handleInputChange(fieldName, e.target.value)}
            label={column.name}>
            <MenuItem value={value}>{value}</MenuItem>
          </Select>
        );
      case '20':
        return (
          <Checkbox
            checked={value === 'Y' || value === true}
            onChange={e =>
              handleInputChange(fieldName, e.target.checked ? 'Y' : 'N')
            }
          />
        );
      case '16':
      case '15':
        return (
          <TextField
            type="datetime-local"
            value={value}
            onChange={e => handleInputChange(fieldName, e.target.value)}
            label={column.name}
          />
        );
      case '11':
      case '12':
      case '29':
      case '22':
      case '800008':
        return (
          <TextField
            type="number"
            value={value}
            onChange={e => handleInputChange(fieldName, e.target.value)}
            label={column.name}
          />
        );
      case '28':
        return (
          <button onClick={() => console.log('Button clicked:', fieldName)}>
            {column.name}
          </button>
        );
      case '14':
      case '34':
        return (
          <TextField
            multiline
            rows={4}
            value={value}
            onChange={e => handleInputChange(fieldName, e.target.value)}
            label={column.name}
          />
        );
      default:
        return (
          <TextField
            value={value}
            onChange={e => handleInputChange(fieldName, e.target.value)}
            label={column.name}
          />
        );
    }
  };

  return (
    <Box>
      <h2>{windowData.name}</h2>
      {columnsData.map(column => (
        <Box key={column.id}>{renderField(column)}</Box>
      ))}
    </Box>
  );
};

export default DynamicForm;
