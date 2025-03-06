/* eslint-disable @typescript-eslint/no-explicit-any */
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { Field, FormMode, Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { FormProvider, useForm } from 'react-hook-form';
import { BaseSelector } from './selectors/BaseSelector';
import { useCallback, useMemo } from 'react';
import { useFormAction } from '@/hooks/useFormAction';
import { useRouter } from 'next/navigation';
import Collapsible from '../Collapsible';

export default function FormView({
  defaultValues,
  window,
  tab,
  mode,
}: {
  defaultValues: Record<string, unknown>;
  window: WindowMetadata;
  tab: Tab;
  mode: FormMode;
}) {
  const router = useRouter();
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

  const fieldGroups = useMemo(() => {
    const groups = {} as Record<
      string,
      { id: string; identifier: string; sequenceNumber: number; fields: Record<string, Field> }
    >;

    Object.entries(fields.formFields).forEach(([fieldName, field]) => {
      const [id = '', identifier = ''] = [field.fieldGroup, field.fieldGroup$_identifier];

      if (!groups[id]) {
        groups[id] = {
          id,
          identifier,
          sequenceNumber: Number.MAX_SAFE_INTEGER,
          fields: {},
        };
      }

      groups[id].fields[fieldName] = field;

      if (groups[id].sequenceNumber > field.sequenceNumber) {
        groups[id].sequenceNumber = field.sequenceNumber;
      }
    });

    return groups;
  }, [fields.formFields]);

  const form = useForm({ values: defaultValues });

  const onSuccess = useCallback(
    (data: any) => {
      router.replace(data[0].id);
    },
    [router],
  );

  const onError = useCallback((data: any) => {
    console.debug('Error', data);
  }, []);

  const { submit } = useFormAction({ window, tab, mode, onSuccess, onError });

  const handleSave = useMemo(() => form.handleSubmit(submit), [form, submit]);

  return (
    <FormProvider {...form}>
      <form className="w-full p-2 space-y-2" onSubmit={handleSave}>
        <Toolbar windowId={window.id} tabId={tab.id} isFormView={true} onSave={handleSave} />
        {Object.entries(fieldGroups)
          .toSorted(([, a], [, b]) => {
            return a.sequenceNumber - b.sequenceNumber;
          })
          .map(([id, group]) => (
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
}
