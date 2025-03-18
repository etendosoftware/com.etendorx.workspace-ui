import { Toolbar } from '@/components/Toolbar/Toolbar';
import {
  EntityData,
  Field,
  FormInitializationResponse,
  FormMode,
  Tab,
  WindowMetadata,
} from '@workspaceui/etendohookbinder/src/api/types';
import { FormProvider, useForm } from 'react-hook-form';
import { BaseSelector } from './selectors/BaseSelector';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormAction } from '@/hooks/useFormAction';
import { useParams, useRouter } from 'next/navigation';
import Collapsible from '../Collapsible';
import StatusBar from './StatusBar';
import { MessageBox } from './MessageBox';
import { useTranslation } from '@/hooks/useTranslation';
import { getFieldsByColumnName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { buildInitialFormState } from '@/utils';
import { useSingleDatasource } from '@workspaceui/etendohookbinder/src/hooks/useSingleDatasource';

export default function FormView({
  window: windowMetadata,
  tab,
  mode,
  formInitialization,
}: {
  window: WindowMetadata;
  tab: Tab;
  mode: FormMode;
  formInitialization: FormInitializationResponse;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const fieldsByColumnName = useMemo(() => getFieldsByColumnName(tab), [tab]);
  const { recordId } = useParams<{ recordId: string }>();
  const { t } = useTranslation();
  const { record, load } = useSingleDatasource(tab.entityName, recordId);

  const handleDismiss = useCallback(() => setMessage(undefined), []);

  const fields = useMemo(() => {
    const statusBarFields: Record<string, Field> = {};
    const formFields: Record<string, Field> = {};
    const actionFields: Record<string, Field> = {};
    const otherFields: Record<string, Field> = {};

    Object.entries(tab.fields).forEach(([, field]) => {
      // Keep this at first because a process field will have field.display == true
      if (field.process || field.column.process) {
        actionFields[field.hqlName] = field;
      } else if (field.shownInStatusBar) {
        statusBarFields[field.hqlName] = field;
      } else if (field.displayed) {
        formFields[field.hqlName] = field;
      } else {
        otherFields[field.hqlName] = field;
      }
    });

    return { statusBarFields, formFields, actionFields, otherFields };
  }, [tab.fields]);

  const fieldGroups = useMemo(() => {
    const groups = {} as Record<
      string,
      { id: string | null; identifier: string; sequenceNumber: number; fields: Record<string, Field> }
    >;

    Object.entries(fields.formFields).forEach(([fieldName, field]) => {
      const [id = '', identifier = ''] = [field.fieldGroup, field.fieldGroup$_identifier];

      if (!groups[id]) {
        groups[id] = {
          id: id || null,
          identifier: identifier || t('forms.sections.main'),
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
  }, [fields.formFields, t]);

  const groups = useMemo(
    () =>
      Object.entries(fieldGroups).toSorted(([, a], [, b]) => {
        return a.sequenceNumber - b.sequenceNumber;
      }),
    [fieldGroups],
  );

  const { reset, ...form } = useForm();

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

  useEffect(() => {
    reset(buildInitialFormState(record, formInitialization, fieldsByColumnName));
  }, [fieldsByColumnName, formInitialization, mode, record, reset]);

  return (
    <FormProvider reset={reset} {...form}>
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
