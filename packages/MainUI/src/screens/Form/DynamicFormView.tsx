/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';
import { Etendo } from '@workspaceui/etendohookbinder/src/api/metadata';
import { useEntityRecord } from '@workspaceui/etendohookbinder/src/hooks/useEntityRecord';

export default function DynamicFormView() {
  const { recordId = '' } = useParams<{ recordId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    console.debug({ recordId });
  }, [recordId]);

  const {
    windowData,
    columnsData,
    loading: windowLoading,
    error: windowError,
  } = useMetadataContext();

  const { data } = useEntityRecord(
    windowData?.tabs[0].entityName ?? '',
    recordId,
  );

  // const handleSave = useCallback(() => navigate('/'), [navigate]);
  // const handleCancel = useCallback(() => navigate('/'), [navigate]);

  // const fields = useMemo(() => {
  //   const sections = {} as Record<string, unknown[]>;
  //   columnsData[windowData.tabs[0].id].forEach(field => {
  //     const group = field.fieldGroup ?? 'default';
  //     sections[group] = sections[group] ?? [];
  //     sections[group].push(field);
  //   });

  //   return sections;
  // }, [columnsData, windowData.tabs]);

  console.debug(data);

  if (windowLoading) {
    return <Spinner />;
  } else if (windowError) {
    return <div>Error: {windowError?.message}</div>;
  } else {
    return (
      <>
        {Object.entries(windowData.tabs[0].fields).map(([key, value]) => {
          return <MagicField key={key} {...value} data={data} />;
        })}
      </>
    );
  }
}

const TextField = (props: Etendo.Field & { data?: any }) => {
  console.log(props.column);

  return (
    <input
      type="text"
      title={props.column.description}
      placeholder={props.column.name}
      className="field"
    />
    // <div className="field">
    //   {props.column.name}
    //   <br />
    //   {props.column.dBColumnName}
    //   <br />
    //   <small>
    //     {JSON.stringify(props.column, null, 2)}
    //     <br />
    //   </small>
    // </div>
  );
};

const DateField = TextField;
const DateTimeField = TextField;
const ListField = TextField;
const TableField = TextField;
const TableDirField = TextField;
const BooleanField = TextField;

const Components = {
  '14': TextField,
  '15': DateField,
  '16': DateTimeField,
  '17': ListField,
  '18': TableField,
  '19': TableDirField,
  '20': BooleanField,
};

const MagicField = (props: Etendo.Field & { data?: any }) => {
  const Cmp =
    Components[props.column.reference as keyof typeof Components] ?? TextField;

  return <Cmp {...props} />;
};
