import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormView from '../../components/FormView';
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

  if (windowLoading || recordLoading) return <Spinner />;
  if (windowError || recordError)
    return <div>Error: {windowError?.message || recordError?.message}</div>;

  return (
    <>
      {Object.entries(windowData.tabs[0].fields).map(([key, value]) => {
        return <MagicField key={key} {...value} />;
      })}
    </>
  );
}

const TableDir = (props: Etendo.Field) => {
  return <div>{props.column.reference}</div>;
};

const BooleanSwitch = (props: Etendo.Field) => {
  return <div>{props.column.reference}</div>;
};

const Components = {
  '19': TableDir,
  '20': BooleanSwitch,
};

const MagicField = (props: Etendo.Field) => {
  const Cmp = Components[props.column.reference as keyof typeof Components] ?? TableDir;

  return <Cmp {...props} />;
};
