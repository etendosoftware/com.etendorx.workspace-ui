import { FieldDefinition } from '@/screens/Form/types';
import { TextInputProps } from '@workspaceui/componentlibrary/components/Input/TextInput/TextInputAutocomplete/TextInputComplete.types';
import TextInputBase from '@workspaceui/componentlibrary/components/Input/TextInput/TextInputBase';

export function StringSelector({
  field,
  value,
  setValue,
  ...props
}: Omit<TextInputProps, 'value'> & {
  field: FieldDefinition;
  value: string | number | null;
  setValue: React.Dispatch<React.SetStateAction<string | number | null>>;
}) {
  return (
    <TextInputBase
      // onChange={e => onChange(field.label, e.currentTarget.value)}
      margin="normal"
      value={value}
      setValue={setValue}
      placeholder={field.original?.fieldName}
      disabled={field.original?.readOnly}
      name={field.original?.inpName}
      autoFocus={field.original?.isFirstFocusedField}
      required={field.original?.isMandatory}
      {...props}
    />
  );
}
