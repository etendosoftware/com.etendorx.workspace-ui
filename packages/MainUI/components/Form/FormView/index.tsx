import { Toolbar } from '@/components/Toolbar/Toolbar';
import { EntityData, FormMode, Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { FormProvider, useForm } from 'react-hook-form';
import { BaseSelector } from './selectors/BaseSelector';
import { useCallback, useMemo, useState } from 'react';
import { useFormAction } from '@/hooks/useFormAction';
import { useRouter } from 'next/navigation';
import Collapsible from '../Collapsible';
import StatusBar from './StatusBar';
import { MessageBox } from './MessageBox';
import useFormFields from '@/hooks/useFormFields';

interface FormViewProps {
  window: WindowMetadata;
  tab: Tab;
  mode: FormMode;
  initialState: EntityData;
}

export default function FormView({ window: windowMetadata, tab, mode, initialState }: FormViewProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const handleDismiss = useCallback(() => setMessage(undefined), []);
  const { fields, groups } = useFormFields(tab);
  const { reset, setValue, ...form } = useForm({ values: initialState });

  const onSuccess = useCallback(
    async (data: EntityData) => {
      if (mode === FormMode.EDIT) {
        reset({ ...initialState, ...data });
      } else {
        router.replace(String(data.id));
      }
      setMessage('Saved');
    },
    [initialState, mode, reset, router],
  );

  const onError = useCallback((data: string) => {
    setMessage(data);
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
            <div className="grid grid-cols-3 auto-rows-auto gap-4">
              {Object.entries(group.fields).map(([hqlName, field]) => (
                <BaseSelector field={field} key={hqlName} formMode={mode} />
              ))}
            </div>
          </Collapsible>
        ))}
      </form>
    </FormProvider>
  );
}
