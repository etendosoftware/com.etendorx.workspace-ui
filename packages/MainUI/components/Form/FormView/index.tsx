import { Toolbar } from '@/components/Toolbar/Toolbar';
import { Field, Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { FormProvider, useForm } from 'react-hook-form';
import { BaseSelector } from './selectors/BaseSelector';
import { useMemo } from 'react';

export default function FormView({
  defaultValues,
  window,
  tab,
}: {
  defaultValues: Record<string, unknown>;
  window: WindowMetadata;
  tab: Tab;
}) {
  const fields = useMemo(() => {
    const statusBarFields: Record<string, Field> = {};
    const formFields: Record<string, Field> = {};
    const actionFields: Record<string, Field> = {};
    const otherFields: Record<string, Field> = {};

    Object.entries(tab.fields).forEach(([hqlName, field]) => {
      // Keep this at first because a process field will have field.display == true
      if (field.process) {
        actionFields[hqlName] = field;
      } else if (field.shownInStatusBar) {
        statusBarFields[hqlName] = field;
      } else if (field.displayed) {
        formFields[hqlName] = field;
      } else {
        otherFields[hqlName] = field;
      }
    });

    return { statusBarFields, formFields, actionFields };
  }, [tab.fields]);

  const form = useForm({ values: defaultValues });

  return (
    <FormProvider {...form}>
      <div className="w-full p-2 space-y-2">
        <Toolbar windowId={window.id} tabId={tab.id} isFormView={true} />
        <div className="grid grid-cols-3 auto-rows-auto gap-8 bg-white rounded-2xl p-4">
          {Object.entries(fields.formFields).map(([hqlName, field]) => (
            <BaseSelector field={field} key={hqlName} />
          ))}
        </div>
      </div>
    </FormProvider>
  );
}
