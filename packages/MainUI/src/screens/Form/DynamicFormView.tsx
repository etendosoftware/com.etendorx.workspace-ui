import { useParams } from 'react-router-dom';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';
import { Etendo } from '@workspaceui/etendohookbinder/src/api/metadata';
import { useEntityRecord } from '@workspaceui/etendohookbinder/src/hooks/useEntityRecord';
import { useCallback, useState } from 'react';

export default function DynamicFormView() {
  const { recordId = '' } = useParams<{ recordId: string }>();

  const {
    windowData,
    loading: windowLoading,
    error: windowError,
  } = useMetadataContext();

  const {
    data,
    loading: recordLoading,
    error: recordError,
  } = useEntityRecord(windowData?.tabs?.[0].entityName ?? '', recordId);

  if (windowLoading || recordLoading) {
    return <Spinner />;
  } else if (windowError || recordError) {
    return <div>Error: {windowError?.message ?? recordError?.message}</div>;
  } else if (data) {
    return (
      <div className="flex">
        {Object.entries(windowData.tabs[0].fields).map(([key, value]) => {
          return <MagicField key={key} {...value} data={data} field={key} />;
        })}
      </div>
    );
  } else {
    return null;
  }
}

const TextField = (props: Etendo.Field & { data: any; field: string }) => {
  const _value =
    props.data[`${props.field}$_identifier`] ?? props.data[props.field] ?? '';
  const [value, setValue] = useState(_value);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value);
  }, []);

  return (
    <label htmlFor={props.field} className="field-group">
      <span>{props.column.name}</span>
      <input
        name={props.field}
        type="text"
        title={props.column.description}
        placeholder={props.column.name}
        value={value}
        onChange={handleChange}
        className="field"
      />
    </label>
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

const MagicField = (props: Etendo.Field & { data: any; field: string }) => {
  const Cmp =
    Components[props.column.reference as keyof typeof Components] ?? TextField;

  return <Cmp {...props} />;
};
