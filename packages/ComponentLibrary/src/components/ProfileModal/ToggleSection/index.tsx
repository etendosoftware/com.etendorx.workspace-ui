import { useMemo } from 'react';
import { Checkbox, FormControl, FormControlLabel, Grid, styled } from '@mui/material';
import { selectorListStyles, formStyle, defaultFill } from './styles';
import OrganizationIcon from '../../../assets/icons/user.svg';
import ClientIcon from '../../../assets/icons/github.svg';
import WarehouseIcon from '../../../assets/icons/warehouse.svg';
import LanguageIcon from '../../../assets/icons/flags/spain.svg';
import { SelectorListProps, Item } from './types';
import { InputPassword, theme } from '../..';
import LockOutlined from '../../../assets/icons/lock.svg';
import Select from '../../Input/Select';

const icons: { [key in Item]: React.ReactElement } = {
  [Item.Role]: <></>,
  [Item.Client]: <ClientIcon fill={defaultFill} />,
  [Item.Organization]: <OrganizationIcon fill={defaultFill} />,
  [Item.Warehouse]: <WarehouseIcon fill={defaultFill} />,
  [Item.Language]: <LanguageIcon />,
};

const CustomCheckbox = styled(Checkbox)(() => ({
  '&.Mui-checked': {
    color: theme.palette.dynamicColor.main,
  },
}));

const noop = () => {};

const SelectorList: React.FC<SelectorListProps> = ({
  section,
  passwordLabel,
  newPasswordLabel,
  confirmPasswordLabel,
  onRoleChange,
  onWarehouseChange,
  roles,
  selectedRole,
  selectedWarehouse,
  saveAsDefault,
  onSaveAsDefaultChange,
}) => {
  const warehouses = useMemo(() => {
    if (selectedRole) {
      const role = roles.find(r => r.id === selectedRole.value);
      return role ? role.orgList.flatMap(org => org.warehouseList) : [];
    }
    return [];
  }, [roles, selectedRole]);

  const roleOptions = useMemo(
    () =>
      roles.map(role => ({
        title: role.name,
        value: role.id,
        id: role.id,
      })),
    [roles],
  );

  const warehouseOptions = useMemo(
    () =>
      warehouses.map(warehouse => ({
        title: warehouse.name,
        value: warehouse.id,
        id: warehouse.id,
      })),
    [warehouses],
  );

  return (
    <div style={selectorListStyles}>
      {section === 'profile' && (
        <>
          <FormControl fullWidth style={formStyle}>
            <Select
              id="role-select"
              title={Item.Role}
              options={roleOptions}
              value={selectedRole}
              onChange={onRoleChange}
              iconLeft={icons[Item.Role]}
            />
            <Select
              id="warehouse-select"
              title={Item.Warehouse}
              options={warehouseOptions}
              value={selectedWarehouse}
              onChange={onWarehouseChange}
              iconLeft={icons[Item.Warehouse]}
              disabled={!selectedRole}
            />
          </FormControl>
          <FormControlLabel
            control={<CustomCheckbox size="small" checked={saveAsDefault} onChange={onSaveAsDefaultChange} />}
            label="Save as Default Profile"
          />
        </>
      )}
      {section === 'password' && (
        <Grid margin="0.5rem">
          <InputPassword
            label={passwordLabel}
            value=""
            setValue={noop}
            leftIcon={<LockOutlined fill={defaultFill} />}
          />
          <InputPassword
            label={newPasswordLabel}
            value=""
            setValue={noop}
            leftIcon={<LockOutlined fill={defaultFill} />}
          />
          <InputPassword
            label={confirmPasswordLabel}
            value=""
            setValue={noop}
            leftIcon={<LockOutlined fill={defaultFill} />}
          />
        </Grid>
      )}
    </div>
  );
};

export default SelectorList;
