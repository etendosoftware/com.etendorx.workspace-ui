import React, { useState } from 'react';
import { FormControl, Grid, FormControlLabel, Checkbox } from '@mui/material';
import { selectorListStyles, formStyle } from './styles';
import RoleIcon from '@mui/icons-material/AccountCircle';
import ClientIcon from '@mui/icons-material/Business';
import OrganizationIcon from '@mui/icons-material/Domain';
import WarehouseIcon from '@mui/icons-material/Store';
import LanguageIcon from '@mui/icons-material/Language';
import { SelectorListProps, Item } from './types';
import { references } from './references';
import { InputPassword } from '../..';
import { LockOutlined } from '@mui/icons-material';
import Select from '../../Input/Select';

const icons: { [key in Item]: React.ReactElement } = {
  [Item.Rol]: <RoleIcon />,
  [Item.Cliente]: <ClientIcon />,
  [Item.Organización]: <OrganizationIcon />,
  [Item.Almacén]: <WarehouseIcon />,
  [Item.Lenguaje]: <LanguageIcon />,
};

const SelectorList: React.FC<SelectorListProps> = ({
  section,
  passwordLabel,
  newPasswordLabel,
  confirmPasswordLabel,
}) => {
  const relevantItems = references[section] || [];
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  return (
    <div style={selectorListStyles}>
      {section === 'profile' &&
        relevantItems.map(({ item, values }) => (
          <React.Fragment key={item}>
            <FormControl fullWidth style={formStyle}>
              <Select
                id={`${item}-select`}
                title={item}
                options={values.map(value => ({ title: value, value }))}
                iconLeft={icons[item]}
              />
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
