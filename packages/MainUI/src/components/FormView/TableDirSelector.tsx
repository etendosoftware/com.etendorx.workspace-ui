import React, { useEffect, useState, useMemo } from 'react';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import Select from '../../../../ComponentLibrary/src/components/Input/Select';
import SearchOutlined from '../../../../ComponentLibrary/src/assets/icons/search.svg';
import { theme } from '../../../../ComponentLibrary/src/theme';
import { useParams } from 'react-router-dom';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';

interface TableDirSelectorProps {
  name: string;
  field: {
    value: string;
    type: string;
    label: string;
    section: string;
    required: boolean;
  };
  onChange: (name: string, value: string) => void;
}

interface Option {
  id: string;
  title: string;
  value: string;
}

const columnToEntityMap: { [key: string]: string } = {
  C_BPartner_Location_ID: 'BusinessPartnerLocation',
  AD_Org_ID: 'Organization',
  C_BPartner_ID: 'BusinessPartner',
  M_PriceList_ID: 'PriceList',
  C_PaymentTerm_ID: 'PaymentTerm',
  C_Currency_ID: 'Currency',
  C_DocType_ID: 'DocumentType',
  M_Shipper_ID: 'Shipper',
  AD_Client_ID: 'Client',
  FIN_Paymentmethod_ID: 'FIN_PaymentMethod',
  // Añade más mapeos según sea necesario
};

const TableDirSelector: React.FC<TableDirSelectorProps> = ({
  name,
  field,
  onChange,
}) => {
  const [options, setOptions] = useState<Option[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const { id: currentWindowId } = useParams<{ id: string }>();

  const {
    columnsData,
    loading: windowLoading,
    error: windowError,
  } = useWindow(currentWindowId ?? '');

  const fieldMetadata = useMemo(() => {
    return columnsData?.find(column => column.columnName === name);
  }, [columnsData, name]);

  const columnIdentifier = fieldMetadata?.column?._identifier;

  const entityName = useMemo(() => {
    if (!columnIdentifier) return null;
    return (
      columnToEntityMap[columnIdentifier] ||
      columnIdentifier.replace(/^[A-Z]_/, '').replace(/_ID$/, '')
    );
  }, [columnIdentifier]);

  const datasourceParams = useMemo(() => {
    if (!entityName) return null;
    return {
      entity: entityName,
      tabId: 'reference',
    };
  }, [entityName]);

  const {
    records,
    loading: entityLoading,
    error: entityError,
  } = useDatasource(
    { tabs: [{ entityName: entityName, id: 'reference' }] },
    datasourceParams ? { reference: true } : null,
  );

  useEffect(() => {
    if (records && records.length > 0) {
      const formattedOptions = records.map(record => ({
        id: record.id,
        title: record._identifier || record.id,
        value: record.id,
      }));
      setOptions(formattedOptions);
    }
    setIsInitializing(false);
  }, [records]);

  console.log('EntityName:', entityName);
  console.log('Datasource Params:', datasourceParams);
  console.log('Records:', records);
  console.log('Entity Loading:', entityLoading);
  console.log('Entity Error:', entityError);

  if (windowLoading || entityLoading || isInitializing) return <Spinner />;
  if (windowError)
    return <div>Error loading window data: {windowError.message}</div>;
  if (!datasourceParams)
    return <div>Error: Missing required parameters for {field.label}</div>;

  if (entityError) {
    console.error(`Error fetching data for ${entityName}:`, entityError);
    return (
      <div>
        Error: {entityError.message || 'Unknown error'}. Please contact support
        if this persists.
      </div>
    );
  }

  if (!entityName) {
    console.warn(`Could not determine entity name for ${field.label}`);
    return <div>Unable to load options for {field.label}</div>;
  }

  return (
    <Select
      iconLeft={
        <SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />
      }
      title={field.value || field.label}
      options={options}
      getOptionLabel={(option: Option) => option.title}
      onChange={(event, value) => {
        if (value) {
          onChange(name, value.value);
        }
      }}
      disabled={entityLoading}
    />
  );
};

export default TableDirSelector;
