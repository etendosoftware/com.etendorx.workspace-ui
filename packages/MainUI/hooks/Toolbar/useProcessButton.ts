import { ProcessButton, ProcessResponse } from '../../components/Toolbar/types';
import { ExecuteProcessParams } from './types';
import { BaseFieldDefinition, Field } from '@workspaceui/etendohookbinder/src/api/types';
import { FieldType } from '@workspaceui/etendohookbinder/src/api/types';

export const useProcessButton = (
  executeProcess: (params: ExecuteProcessParams) => Promise<ProcessResponse>,
  refetch: () => Promise<void>,
) => {
  const handleProcessClick = async (btn: ProcessButton, recordId: string | undefined): Promise<ProcessResponse> => {
    if (!recordId) {
      throw new Error('No record selected');
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

      if (result.refreshParent) {
        await refetch();
      }

      return result;
    } catch (error) {
      return {
        responseActions: [
          {
            showMsgInProcessView: {
              msgType: 'error',
              msgTitle: 'Error',
              msgText: error instanceof Error ? error.message : 'Unknown error occurred',
            },
          },
        ],
      };
    }
  };

  return { handleProcessClick };
};
