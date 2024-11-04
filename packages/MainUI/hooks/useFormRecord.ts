import { useSingleDatasource } from '@workspaceui/etendohookbinder/src/hooks/useSingleDatasource';

export default function useFormRecord(entity: string, id: string) {
  const { record } = useSingleDatasource(entity, id);

  return record;
}
