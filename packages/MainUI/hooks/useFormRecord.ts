import { useSingleDatasource } from '@workspaceui/etendohookbinder/hooks/useSingleDatasource';

export default function useFormRecord(entity?: string, id?: string) {
  const { record } = useSingleDatasource(entity, id);

  return record;
}
