import { useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useEntityRecord } from '@workspaceui/etendohookbinder/src/hooks/useEntityRecord';
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';
import { Etendo } from '@workspaceui/etendohookbinder/src/api/metadata';

export default function DynamicFormView() {
  const { recordId = '' } = useParams<{ recordId: string }>();
  const navigate = useNavigate();

  const {
    windowData,
    columnsData,
    loading: windowLoading,
    error: windowError,
  } = useMetadataContext();

  const {
    data,
    loading: recordLoading,
    error: recordError,
  } = useEntityRecord(windowData?.tabs[0].entityName ?? '', recordId);

  const handleSave = useCallback(() => navigate('/'), [navigate]);
  const handleCancel = useCallback(() => navigate('/'), [navigate]);

  const fields = useMemo(() => {
    const sections = {} as Record<string, unknown[]>;
    columnsData[windowData.tabs[0].id].forEach(field => {
      const group = field.fieldGroup ?? 'default';
      sections[group] = sections[group] ?? [];
      sections[group].push(field);
    });

    return sections;
  }, [columnsData]);

  if (windowLoading || recordLoading) return <Spinner />;
  if (windowError || recordError)
    return <div>Error: {windowError?.message || recordError?.message}</div>;

  console.log(fields);

  return (
    <>
      {Object.entries(windowData.tabs[0].fields).map(([key, value]) => {
        return <MagicField key={key} {...value} />;
      })}
    </>
  );
}

const TextField = (props: Etendo.Field) => {
  return <div>{props.column.reference$_identifier}</div>;
};

const DateField = (props: Etendo.Field) => {
  return <div>{props.column.reference$_identifier}</div>;
};

const DateTimeField = (props: Etendo.Field) => {
  return <div>{props.column.reference$_identifier}</div>;
};

const ListField = (props: Etendo.Field) => {
  return <div>{props.column.reference$_identifier}</div>;
};

const TableField = (props: Etendo.Field) => {
  return <div>{props.column.reference$_identifier}</div>;
};

const TableDirField = (props: Etendo.Field) => {
  return <div>{props.column.reference$_identifier}</div>;
};

const BooleanField = (props: Etendo.Field) => {
  return <div>{props.column.reference$_identifier}</div>;
};

const Components = {
  '14': TextField,
  '15': DateField,
  '16': DateTimeField,
  '17': ListField,
  '18': TableField,
  '19': TableDirField,
  '20': BooleanField,
};

const MagicField = (props: Etendo.Field) => {
  const Cmp =
    Components[props.column.reference as keyof typeof Components] ?? TextField;

  return <Cmp {...props} />;
};
