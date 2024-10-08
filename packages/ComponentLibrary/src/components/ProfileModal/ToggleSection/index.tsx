import React, { useEffect, useState } from 'react';
import { FormControl, Grid, FormControlLabel, Checkbox, styled } from '@mui/material';
import { selectorListStyles, formStyle, defaultFill } from './styles';
import OrganizationIcon from '../../../assets/icons/user.svg';
import ClientIcon from '../../../assets/icons/github.svg';
import WarehouseIcon from '../../../assets/icons/warehouse.svg';
import LanguageIcon from '../../../assets/icons/flags/spain.svg';
import { SelectorListProps, Item } from './types';
import { InputPassword } from '../..';
import LockOutlined from '../../../assets/icons/lock.svg';
import Select from '../../Input/Select';
import { Option } from '../../Input/Select/types';

const icons: { [key in Item]: React.ReactElement } = {
  [Item.Rol]: <></>,
  [Item.Cliente]: <ClientIcon fill={defaultFill} />,
  [Item.Organización]: <OrganizationIcon fill={defaultFill} />,
  [Item.Almacén]: <WarehouseIcon fill={defaultFill} />,
  [Item.Lenguaje]: <LanguageIcon />,
};

const SelectorList: React.FC<SelectorListProps> = ({
  section,
  passwordLabel,
  newPasswordLabel,
  confirmPasswordLabel,
  onRoleChange,
  roles,
  currentRole,
}) => {
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [selectedRole, setSelectedRole] = useState<Option | null>(
    currentRole ? { title: currentRole.name, value: currentRole.id, id: currentRole.id } : null,
  );

  useEffect(() => {
    if (selectedRole) {
      onRoleChange(selectedRole.value);
    }
  }, [selectedRole, onRoleChange]);

  const CustomCheckbox = styled(Checkbox)(({ theme }) => ({
    '&.Mui-checked': {
      color: theme.palette.dynamicColor.main,
    },
  }));

  const handleRoleChange = (_event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    setSelectedRole(value);
  };

  return (
    <div style={selectorListStyles}>
      {section === 'profile' && (
        <React.Fragment>
          <FormControl fullWidth style={formStyle}>
            <Select
              id="role-select"
              title={Item.Rol}
              options={roles.map(role => ({
                title: role.name,
                value: role.id,
                id: role.id,
              }))}
              value={selectedRole}
              onChange={handleRoleChange}
              iconLeft={icons[Item.Rol]}
            />
          </FormControl>
        </React.Fragment>
      )}
      {section === 'profile' && <FormControlLabel control={<CustomCheckbox size="small" />} label="Save Profile" />}
      {section === 'password' && (
        <Grid sx={{ margin: '0.5rem' }}>
          <InputPassword
            label={passwordLabel}
            value={password}
            setValue={setPassword}
            leftIcon={<LockOutlined fill={defaultFill} />}
          />
          <InputPassword
            label={newPasswordLabel}
            value={newPassword}
            setValue={setNewPassword}
            leftIcon={<LockOutlined fill={defaultFill} />}
          />
          <InputPassword
            label={confirmPasswordLabel}
            value={confirmNewPassword}
            setValue={setConfirmNewPassword}
            leftIcon={<LockOutlined fill={defaultFill} />}
          />
        </Grid>
      )}
    </div>
  );
};

export default SelectorList;
