import { useRef } from 'react';
import { Box } from '@workspaceui/componentlibrary/components';
import { Field } from '@workspaceui/etendohookbinder/api/types';
import { useTheme } from '@mui/material';

const parseFields = (fields: Record<string, Field>) => {
  const statusBarFields: Record<string, Field> = {};
  const formFields: Record<string, Field> = {};
  const actionFields: Record<string, Field> = {};
  const otherFields: Record<string, Field> = {};

  Object.entries(fields).forEach(([name, field]) => {
    // Keep this at first because a process field will have field.display == true
    if (field.process) {
      actionFields[name] = field;
    } else if (field.shownInStatusBar) {
      statusBarFields[name] = field;
    } else if (field.displayed) {
      formFields[name] = field;
    } else {
      otherFields[name] = field;
    }
  });

  return { statusBarFields, formFields, actionFields, otherFields };
};

interface FormSectionProps {
  fields: Record<string, Field>;
  record: Record<string, unknown>;
}

export function FormFields({ fields, record }: FormSectionProps) {
  const theme = useTheme();

  return (
    <Box padding={1} bgcolor={theme.palette.background.paper} borderRadius={theme.shape.borderRadius}>
      <h4>Form Fields</h4>
      <hr />
      {Object.entries(fields).map(([, field]: [string, Field], index: number) =>
        field.startnewline || index % 4 == 0 ? (
          <>
            {index > 0 ? <br /> : null}
            <Box bgcolor="gray" display="inline-block">
              <b>
                {field.name} ({field.column['reference$_identifier']}):
              </b>{' '}
              {(record[field.columnName + '$_identifier'] as string) ?? (record[field.columnName] as string)}
            </Box>
          </>
        ) : (
          <Box display="inline-block">
            <b>
              {field.name} ({field.column['reference$_identifier']}):
            </b>{' '}
            {(record[field.columnName + '$_identifier'] as string) ?? (record[field.columnName] as string)}
          </Box>
        ),
      )}
    </Box>
  );
}

export function ActionFields({ fields, record }: FormSectionProps) {
  const theme = useTheme();

  return (
    <Box padding={1} bgcolor={theme.palette.background.paper} borderRadius={theme.shape.borderRadius}>
      <h4>Action Fields</h4>
      <hr />
      {Object.entries(fields).map(([, field]: [string, Field], index: number) =>
        field.startnewline ? (
          <>
            {index > 0 ? <br /> : null}
            <Box bgcolor="gray" display="inline-block">
              <b>
                {field.name} ({field.column['reference$_identifier']}):
              </b>{' '}
              {(record[field.columnName + '$_identifier'] as string) ?? (record[field.columnName] as string)}
            </Box>
          </>
        ) : (
          <Box display="inline-block">
            <b>
              {field.name} ({field.column['reference$_identifier']}):
            </b>{' '}
            {(record[field.columnName + '$_identifier'] as string) ?? (record[field.columnName] as string)}
          </Box>
        ),
      )}
    </Box>
  );
}

export function StatusBarFields({ fields, record }: FormSectionProps) {
  const theme = useTheme();

  return (
    <Box padding={1} bgcolor={theme.palette.background.paper} borderRadius={theme.shape.borderRadius}>
      <h4>Status Bar Fields</h4>
      <hr />
      {Object.entries(fields).map(([, field]: [string, Field], index: number) =>
        field.startnewline ? (
          <>
            {index > 0 ? <br /> : null}
            <Box bgcolor="gray" display="inline-block">
              <b>
                {field.name} ({field.column['reference$_identifier']}):
              </b>{' '}
              {(record[field.columnName + '$_identifier'] as string) ?? (record[field.columnName] as string)}
            </Box>
          </>
        ) : (
          <Box display="inline-block">
            <b>
              {field.name} ({field.column['reference$_identifier']}):
            </b>{' '}
            {(record[field.columnName + '$_identifier'] as string) ?? (record[field.columnName] as string)}
          </Box>
        ),
      )}
    </Box>
  );
}

export function OtherFields({ fields, record }: FormSectionProps) {
  const theme = useTheme();

  return (
    <Box padding={1} bgcolor={theme.palette.background.paper} borderRadius={theme.shape.borderRadius}>
      <h4>Other Fields</h4>
      <hr />
      {Object.entries(fields).map(([, field]: [string, Field], index: number) =>
        field.startnewline ? (
          <>
            {index > 0 ? <br /> : null}
            <Box bgcolor="gray" display="inline-block">
              <b>
                {field.name} ({field.column['reference$_identifier']}):
              </b>{' '}
              {(record[field.columnName + '$_identifier'] as string) ?? (record[field.columnName] as string)}
            </Box>
          </>
        ) : (
          <Box display="inline-block">
            <b>
              {field.name} ({field.column['reference$_identifier']}):
            </b>{' '}
            {(record[field.columnName + '$_identifier'] as string) ?? (record[field.columnName] as string)}
          </Box>
        ),
      )}
    </Box>
  );
}

export function FormBuilder({ fields, record }: FormSectionProps) {
  const form = useRef(parseFields(fields)).current;

  return (
    <Box display="flex" flexDirection="column" padding={1} gap={1}>
      <StatusBarFields fields={form.statusBarFields} record={record} />
      <ActionFields fields={form.actionFields} record={record} />
      <FormFields fields={form.formFields} record={record} />
      <OtherFields fields={form.otherFields} record={record} />
    </Box>
  );
}
