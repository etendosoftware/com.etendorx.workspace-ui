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
  const handleRoleChange = (_event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    if (value) {
      onRoleChange(value.value);
    }
  };

  const CustomCheckbox = styled(Checkbox)(() => ({
    '&.Mui-checked': {
      color: theme.palette.dynamicColor.main,
    },
  }));

  return (
    <div style={selectorListStyles}>
      {section === 'profile' && (
        <FormControl fullWidth style={formStyle}>
          <Select
            id="role-select"
            title={Item.Rol}
            options={roles.map(role => ({
              title: role.name,
              value: role.id,
              id: role.id,
            }))}
            value={currentRole ? { title: currentRole.name, value: currentRole.id, id: currentRole.id } : null}
            onChange={handleRoleChange}
            iconLeft={icons[Item.Rol]}
          />
        </FormControl>
      )}
      {section === 'profile' && <FormControlLabel control={<CustomCheckbox size="small" />} label="Save Profile" />}
      {section === 'password' && (
        <Grid sx={{ margin: '0.5rem' }}>
          <InputPassword
            label={passwordLabel}
            value=""
            setValue={() => {}}
            leftIcon={<LockOutlined fill={defaultFill} />}
          />
          <InputPassword
            label={newPasswordLabel}
            value=""
            setValue={() => {}}
            leftIcon={<LockOutlined fill={defaultFill} />}
          />
          <InputPassword
            label={confirmPasswordLabel}
            value=""
            setValue={() => {}}
            leftIcon={<LockOutlined fill={defaultFill} />}
          />
        </Grid>
      )}
    </div>
  );
};

export default SelectorList;
