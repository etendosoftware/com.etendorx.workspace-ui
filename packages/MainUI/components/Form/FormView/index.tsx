import { Toolbar } from '@/components/Toolbar/Toolbar';
import { Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { FormProvider, useForm } from 'react-hook-form';
import { BaseSelector } from './selectors/BaseSelector';

export default function FormView({
  defaultValues,
  window,
  tab,
}: {
  defaultValues: Record<string, unknown>;
  window: WindowMetadata;
  tab: Tab;
}) {
  const form = useForm({ values: defaultValues });

  return (
    <FormProvider {...form}>
      <div className="w-full p-2 space-y-2">
        <Toolbar windowId={window.id} tabId={tab.id} isFormView={true} />
        <div className="grid grid-cols-2 auto-rows-auto gap-8 bg-white rounded-2xl p-4">
          {Object.entries(tab.fields).map(([hqlName, field]) => (
            <BaseSelector field={field} key={hqlName} />
          ))}
        </div>
      </div>
    </FormProvider>
  );
}
