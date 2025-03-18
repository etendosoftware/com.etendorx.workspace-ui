import { Toolbar } from '@/components/Toolbar/Toolbar';
import {
  EntityData,
  FormInitializationResponse,
  FormMode,
  Tab,
  WindowMetadata,
} from '@workspaceui/etendohookbinder/src/api/types';
import { FormProvider, useForm } from 'react-hook-form';
import { BaseSelector } from './selectors/BaseSelector';
import { useCallback, useMemo, useState } from 'react';
import { useFormAction } from '@/hooks/useFormAction';
import { useParams, useRouter } from 'next/navigation';
import Collapsible from '../Collapsible';
import StatusBar from './StatusBar';
import { MessageBox } from './MessageBox';
import { getFieldsByColumnName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { useSingleDatasource } from '@workspaceui/etendohookbinder/src/hooks/useSingleDatasource';
import { useFormInitialState } from '@/hooks/useFormInitialState';
import useFormFields from '@/hooks/useFormFields';

interface FormViewProps {
  window: WindowMetadata;
  tab: Tab;
  mode: FormMode;
  initialState: EntityData;
  load: () => Promise<void>;
}

interface FormViewWrapperProps {
  window: WindowMetadata;
  tab: Tab;
  mode: FormMode;
  formInitialization: FormInitializationResponse;
}

const FormViewComponent = ({ window: windowMetadata, tab, mode, load, initialState }: FormViewProps) => {
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const handleDismiss = useCallback(() => setMessage(undefined), []);
  const { fields, groups } = useFormFields(tab);
  const { reset, setValue, ...form } = useForm({ defaultValues: initialState });

  const onSuccess = useCallback(
    async (data: EntityData) => {
      if (mode === FormMode.EDIT) {
        load();
      } else {
        router.prefetch(String(data.id));
        router.replace(String(data.id));
      }
      setMessage('Saved');
    },
    [load, mode, router],
  );

  const onError = useCallback((_data: unknown) => {
    setMessage('Error saving record: ' + String(_data));
  }, []);

  const { submit, loading } = useFormAction({ window: windowMetadata, tab, mode, onSuccess, onError });

  const handleSave = useMemo(() => form.handleSubmit(submit), [form, submit]);

  return (
    <FormProvider setValue={setValue} reset={reset} {...form}>
      <form
        className={`w-full p-2 space-y-2 transition duration-300 h-full overflow-scroll ${loading ? 'opacity-50 select-none cursor-progress cursor-to-children' : ''}`}
        onSubmit={handleSave}>
        <Toolbar windowId={windowMetadata.id} tabId={tab.id} isFormView={true} onSave={handleSave} />
        <MessageBox message={message} onDismiss={handleDismiss} />
        <StatusBar fields={fields.statusBarFields} />
        {groups.map(([id, group]) => (
          <Collapsible key={id} title={group.identifier} initialState={group.id === null}>
            <div className="grid grid-cols-4 auto-rows-auto gap-4">
              {Object.entries(group.fields).map(([hqlName, field]) => (
                <BaseSelector field={field} key={hqlName} />
              ))}
            </div>
          </Collapsible>
        ))}
      </form>
    </FormProvider>
  );
};

export default function FormView({ formInitialization, mode, tab, window }: FormViewWrapperProps) {
  const { recordId } = useParams<{ recordId: string }>();
  const { record, load } = useSingleDatasource(tab.entityName, recordId);
  const fieldsByColumnName = useMemo(() => getFieldsByColumnName(tab), [tab]);
  const initialState = useFormInitialState(record, formInitialization, fieldsByColumnName);

  return <FormViewComponent initialState={initialState} mode={mode} tab={tab} window={window} load={load} />;
}
