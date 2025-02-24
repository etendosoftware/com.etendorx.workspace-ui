import { Toolbar } from '@/components/Toolbar/Toolbar';
import { Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { FormProvider, UseFormReturn } from 'react-hook-form';
import { BaseSelector } from './selectors/BaseSelector';

export default function FormView({ form, window, tab }: { form: UseFormReturn; window: WindowMetadata; tab: Tab }) {
  return (
    <FormProvider {...form}>
      <div className="w-full p-2">
        <Toolbar windowId={window.id} tabId={tab.id} isFormView={true} />
        <div className="grid grid-cols-2 auto-rows-auto gap-y-4 bg-white rounded-2xl">
          {Object.entries(tab.fields).map(([hqlName, field], index) => (
            <div key={hqlName} className={index > 1 ? 'border-t' : ''}>
              <BaseSelector field={field} />
            </div>
          ))}
        </div>
      </div>
    </FormProvider>
  );
}
