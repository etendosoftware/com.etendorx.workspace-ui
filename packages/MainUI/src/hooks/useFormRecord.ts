import { useMemo } from 'react';
import { useDatasource } from '@workspaceui/etendohookbinder/hooks/useDatasource';

export default function useFormRecord(entity: string, id: string) {
  const { records } = useDatasource(
    entity,
    useMemo(
      () => ({
        criteria: [
          {
            fieldName: 'id',
            operator: 'equals',
            value: id,
          },
        ],
      }),
      [id],
    ),
  );

  return records[0];
}
