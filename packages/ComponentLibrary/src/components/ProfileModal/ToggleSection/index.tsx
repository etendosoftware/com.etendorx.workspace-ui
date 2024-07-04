import React, { useState } from 'react';
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
  Grid,
} from '@mui/material';
import {
  selectorListStyles,
  labelStyles,
  iconStyles,
  formStyle,
} from './styles';
import RoleIcon from '@mui/icons-material/AccountCircle';
import ClientIcon from '@mui/icons-material/Business';
import OrganizationIcon from '@mui/icons-material/Domain';
import WarehouseIcon from '@mui/icons-material/Store';
import LanguageIcon from '@mui/icons-material/Language';
import { SelectorListProps, Item } from './types';
import { references } from './references';
import { InputPassword } from '../..';
import { LockOutlined } from '@mui/icons-material';

const icons: { [key in Item]: React.ReactElement } = {
  [Item.Rol]: <RoleIcon style={iconStyles} />,
  [Item.Cliente]: <ClientIcon style={iconStyles} />,
  [Item.Organización]: <OrganizationIcon style={iconStyles} />,
  [Item.Almacén]: <WarehouseIcon style={iconStyles} />,
  [Item.Lenguaje]: <LanguageIcon style={iconStyles} />,
};

const SelectorList: React.FC<SelectorListProps> = ({
  section,
  passwordLabel,
  newPasswordLabel,
  confirmPasswordLabel,
}) => {
  const relevantItems = references[section] || [];
  const [selectedValues, setSelectedValues] = useState<{
    [key in Item]?: string;
  }>({});

  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleChange = (event: SelectChangeEvent<string>, item: Item) => {
    setSelectedValues({
      ...selectedValues,
      [item]: event.target.value,
    });
  };

  return (
    <div style={selectorListStyles}>
      {section === 'profile' &&
        relevantItems.map(({ item, values }) => (
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
      {section === 'password' && (
        <Grid sx={{ margin: '0.5rem' }}>
          <InputPassword
            label={passwordLabel}
            value={password}
            setValue={setPassword}
            leftIcon={<LockOutlined />}
          />
          <InputPassword
            label={newPasswordLabel}
            value={newPassword}
            setValue={setNewPassword}
            leftIcon={<LockOutlined />}
          />
          <InputPassword
            label={confirmPasswordLabel}
            value={confirmNewPassword}
            setValue={setConfirmNewPassword}
            leftIcon={<LockOutlined />}
          />
        </Grid>
      )}
    </div>
  );
};

export default SelectorList;
