import React from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  ListItemIcon,
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  selectorListStyles,
  labelStyles,
  iconStyles,
  formStyle,
} from './SelectorList.styles';
import RoleIcon from '@mui/icons-material/AccountCircle';
import ClientIcon from '@mui/icons-material/Business';
import OrganizationIcon from '@mui/icons-material/Domain';
import WarehouseIcon from '@mui/icons-material/Store';
import LanguageIcon from '@mui/icons-material/Language';
import { SelectorListProps, Item } from './SelectorList.types';
import { references } from './SelectorList.reference';

const icons: Record<Item, React.ReactElement> = {
  [Item.Rol]: <RoleIcon style={iconStyles} />,
  [Item.Cliente]: <ClientIcon style={iconStyles} />,
  [Item.Organización]: <OrganizationIcon style={iconStyles} />,
  [Item.Almacén]: <WarehouseIcon style={iconStyles} />,
  [Item.Lenguaje]: <LanguageIcon style={iconStyles} />,
};

const SelectorList: React.FC<SelectorListProps> = ({ section }) => {
  const relevantItems = references[section] || [];

  const [selectedValues, setSelectedValues] = React.useState<{
    [key in Item]?: string;
  }>({});

  const handleChange = (event: SelectChangeEvent<string>, item: Item) => {
    setSelectedValues({
      ...selectedValues,
      [item]: event.target.value,
    });
  };

  return (
    <div style={selectorListStyles}>
      {relevantItems.map(({ item, values }) => (
        <React.Fragment key={item}>
          <FormControl fullWidth variant="standard" style={formStyle}>
            <InputLabel id={`${item}-label`} style={labelStyles}>
              {item}
            </InputLabel>
            <Select
              labelId={`${item}-label`}
              id={`${item}-select`}
              value={selectedValues[item] ?? ''}
              onChange={event => handleChange(event, item)}
              label={item}
              renderValue={selected => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ListItemIcon>{icons[item]}</ListItemIcon>
                  <Typography>{`${item} ${selected}`}</Typography>
                </div>
              )}>
              {values.map(value => (
                <MenuItem key={value} value={value}>
                  {item} {value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </React.Fragment>
      ))}
      {section === 'profile' && (
        <FormControlLabel
          control={<Checkbox />}
          label="Guardar perfil por defecto"
        />
      )}
    </div>
  );
};

export default SelectorList;
