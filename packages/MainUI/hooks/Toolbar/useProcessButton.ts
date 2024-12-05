import { ProcessButton, ProcessResponse } from '../../components/Toolbar/types';
import { ExecuteProcessParams } from './types';
import { BaseFieldDefinition, Field } from '@workspaceui/etendohookbinder/src/api/types';
import { FieldType } from '@workspaceui/etendohookbinder/src/api/types'; // Asegúrate de importar FieldType

export const useProcessButton = (
  executeProcess: (params: ExecuteProcessParams) => Promise<ProcessResponse>,
  refetch: () => Promise<void>,
) => {
  const handleProcessClick = async (btn: ProcessButton, recordId: string | undefined) => {
    if (!recordId) {
      console.warn('No record selected');
      return;
    }

    const processParams =
      btn.processInfo?.parameters?.reduce(
        (acc, param) => ({
          ...acc,
          [param.id]: param.defaultValue ?? null,
        }),
        {},
      ) || {};

    const recordIdField: BaseFieldDefinition<string> = {
      value: recordId,
      type: 'string' as FieldType,
      label: 'Record ID',
      name: 'recordId',
      original: {} as Field,
    };

    try {
      const result = await executeProcess({
        button: btn,
        recordId: recordIdField,
        params: processParams,
      });

      if (result.response.status === 0) {
        return refetch();
      }
      console.error('Process error:', result.response.error?.message);
    } catch (error) {
      console.error('Process execution failed:', error);
    }
  };

  return { handleProcessClick };
};
