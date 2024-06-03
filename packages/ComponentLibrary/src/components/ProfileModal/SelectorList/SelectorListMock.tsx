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
import { SelectorListProps, Item } from './SelectorList.types';
import RoleIcon from '@mui/icons-material/AccountCircle';
import ClientIcon from '@mui/icons-material/Business';
import OrganizationIcon from '@mui/icons-material/Domain';
import WarehouseIcon from '@mui/icons-material/Store';
import LanguageIcon from '@mui/icons-material/Language';

const items: Item[] = ['Rol', 'Cliente', 'Organización', 'Almacén', 'Lenguaje'];

const icons: Record<Item, React.ReactElement> = {
  Rol: <RoleIcon style={iconStyles} />,
  Cliente: <ClientIcon style={iconStyles} />,
  Organización: <OrganizationIcon style={iconStyles} />,
  Almacén: <WarehouseIcon style={iconStyles} />,
  Lenguaje: <LanguageIcon style={iconStyles} />,
};

const SelectorList: React.FC<SelectorListProps> = ({ section }) => {
  const relevantItems = section === 'profile' ? items : [];

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
      {relevantItems.map(item => (
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
              <MenuItem value="1">{item} 1</MenuItem>
              <MenuItem value="2">{item} 2</MenuItem>
              <MenuItem value="3">{item} 3</MenuItem>
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
