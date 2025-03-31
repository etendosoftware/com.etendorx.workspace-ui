import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import Select from '@/components/Form/FormView/selectors/components/Select';
import { useTableDirDatasource } from '@/hooks/datasource/useTableDirDatasource';
import { useSelectFieldOptions } from '@/hooks/useSelectFieldOptions';

export const TableDirSelector = ({ field, isReadOnly }: { field: Field; isReadOnly: boolean }) => {
  const { records, refetch } = useTableDirDatasource({ field });
  const options = useSelectFieldOptions(field, records);

  return <Select name={field.hqlName} options={options} onFocus={refetch} isReadOnly={isReadOnly} field={field} />;
};
