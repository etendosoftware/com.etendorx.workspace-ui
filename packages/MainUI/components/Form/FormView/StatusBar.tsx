import { Box, Typography, useTheme } from '@mui/material';
import { BaseFieldDefinition, SelectOption } from '@workspaceui/etendohookbinder/src/api/types';

type StatusBarFieldDefinition =
  | BaseFieldDefinition<string>
  | BaseFieldDefinition<number>
  | BaseFieldDefinition<boolean>
  | BaseFieldDefinition<Date>
  | BaseFieldDefinition<string[]>
  | BaseFieldDefinition<SelectOption>
  | BaseFieldDefinition<Record<string, unknown>>;

const StatusBar: React.FC<{ statusFields: [string, StatusBarFieldDefinition][] }> = ({ statusFields }) => {
  const theme = useTheme();

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
    <Box
      sx={{
        display: 'flex',
        gap: 4,
        p: 2,
        bgcolor: theme.palette.baselineColor.neutral[10],
        borderRadius: '2rem',
        marginBottom: '0.5rem',
      }}>
      {statusFields.map(([key, field]) => (
        <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {field.label}:
          </Typography>
          <Typography variant="body2">{getDisplayValue(field)}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default StatusBar;
