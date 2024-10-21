import { useMemo } from 'react';
import { Box } from '@workspaceui/componentlibrary/components';
import { Field } from '@workspaceui/etendohookbinder/api/types';

export function FormBuilder({ fields, record }: { fields: Field[]; record: Record<string, unknown> }) {
  const form = useMemo(() => {
    const statusBarFields: Field[] = [];
    const formFields: Field[] = [];
    const actionFields: Field[] = [];
    const otherFields: Field[] = [];

    fields.forEach(field => {
      // Keep this at first because a process field will have field.display == true
      if (field.process) {
        actionFields.push(field);
      } else if (field.shownInStatusBar) {
        statusBarFields.push(field);
      } else if (field.displayed) {
        formFields.push(field);
      } else {
        otherFields.push(field);
      }
    });

    return { statusBarFields, formFields, actionFields };
  }, [fields]);

  return (
    <Box>
      {form.formFields.map((field: Field, index: number) =>
        field.startnewline || index % 4 == 0 ? (
          <>
            {index > 0 ? <br /> : null}
            <Box bgcolor="gray" display="inline-block">
              <b>{field.name}:</b>{' '}
              {(record[field.columnName + '$_identifier'] as string) ?? (record[field.columnName] as string)}
            </Box>
          </>
        ) : (
          <Box display="inline-block">
            <b>{` | ${field.name}:`}</b>
            {record[field.columnName] as string}
          </Box>
        ),
      )}
    </Box>
  );
}
