import { Box, Typography } from '@mui/material';
import { BaseFieldDefinition, SelectOption } from '@workspaceui/etendohookbinder/src/api/types';
import { useStyle } from './styles';

type StatusBarFieldDefinition =
  | BaseFieldDefinition<string>
  | BaseFieldDefinition<number>
  | BaseFieldDefinition<boolean>
  | BaseFieldDefinition<Date>
  | BaseFieldDefinition<string[]>
  | BaseFieldDefinition<SelectOption>
  | BaseFieldDefinition<Record<string, unknown>>;

const StatusBar: React.FC<{ statusFields: [string, StatusBarFieldDefinition][] }> = ({ statusFields }) => {
  const { sx } = useStyle();

  const getDisplayValue = (field: StatusBarFieldDefinition): string => {
    if (field.type === 'boolean') {
      return field.value === true ? 'Yes' : 'No';
    }

    if (field.value === null || field.value === undefined) return '-';

    if (field.type === 'tabledir' && typeof field.value === 'object') {
      const value = field.value as Record<string, unknown>;
      return String(value._identifier || value.title || '-');
    }

    if (field.original?.column?.reference === '12') {
      return typeof field.value === 'number' ? field.value.toFixed(2) : String(field.value);
    }

    return String(field.displayValue || field.value);
  };

  return (
    <Box sx={sx.statusBarContainer}>
      {statusFields.map(([key, field]) => (
        <Box key={key} sx={sx.statusItemContainer}>
          <Typography variant="subtitle2" sx={sx.statusLabel}>
            {field.label}:
          </Typography>
          <Typography variant="body2" sx={sx.statusValue}>
            {getDisplayValue(field)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default StatusBar;
