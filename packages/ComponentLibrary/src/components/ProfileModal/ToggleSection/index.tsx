import { useMemo } from 'react';
import { Checkbox, FormControl, FormControlLabel, Grid, styled, useTheme } from '@mui/material';
import { useStyle } from './styles';
import OrganizationIcon from '../../../assets/icons/user.svg';
import ClientIcon from '../../../assets/icons/github.svg';
import WarehouseIcon from '../../../assets/icons/warehouse.svg';
import LockOutlined from '../../../assets/icons/lock.svg';
import Select from '../../Input/Select';
import { InputPassword } from '../..';
import { Option } from '../../Input/Select/types';
import { SelectorListProps, BaseWarehouse } from '../types';
import { Item } from '../../enums';

const isOptionEqualToValue = (option: Option, value: Option) => option.id === value.id;

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
  onLanguageChange,
  selectedLanguage,
  languages,
  saveAsDefault,
  onSaveAsDefaultChange,
  translations,
  languagesFlags,
}) => {
  const { styles, defaultFill } = useStyle();
  const theme = useTheme();

  const FlagEmoji = ({ flag }: { flag: string }) => <span style={styles.flagStyles}>{flag}</span>;

  const icons: { [key in Item]: React.ReactElement } = {
    [Item.Role]: <></>,
    [Item.Client]: <ClientIcon fill={defaultFill} />,
    [Item.Organization]: <OrganizationIcon fill={defaultFill} />,
    [Item.Warehouse]: <WarehouseIcon fill={defaultFill} />,
    [Item.Language]: <FlagEmoji flag={languagesFlags} />,
  };

  const CustomCheckbox = styled(Checkbox)(() => ({
    '&.Mui-checked': {
      color: theme.palette.dynamicColor.main,
    },
  }));

  const warehouses = useMemo(() => {
    if (selectedRole) {
      const _warehouses = {} as Record<string, BaseWarehouse>;
      const role = roles.find(r => r.id === selectedRole.value);

      role?.orgList.forEach(org => {
        org.warehouseList.forEach(w => {
          _warehouses[w.id] = w;
        });
      });

      return role ? Object.values(_warehouses) : [];
    }

    return [];
  }, [roles, selectedRole]);

  const roleOptions = useMemo(
    () =>
      roles?.map(role => ({
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

  const languageOptions = useMemo(
    () =>
      languages?.map((lang: { name: string; language: string; id: string }) => ({
        title: lang.name,
        value: lang.language,
        id: lang.id,
      })),
    [languages],
  );

  return (
    <div style={styles.selectorListStyles}>
      {section === 'profile' && (
        <>
          <FormControl fullWidth style={styles.formStyle}>
            <Select
              id="role-select"
              title={Item.Role}
              options={roleOptions}
              value={selectedRole}
              onChange={onRoleChange}
              iconLeft={icons[Item.Role]}
              isOptionEqualToValue={isOptionEqualToValue}
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
            <Select
              id="language-select"
              title={Item.Language}
              options={languageOptions}
              value={selectedLanguage}
              onChange={onLanguageChange}
              iconLeft={icons[Item.Language]}
            />
          </FormControl>
          <FormControlLabel
            control={<CustomCheckbox size="small" checked={saveAsDefault} onChange={onSaveAsDefaultChange} />}
            label={translations?.saveAsDefault}
          />
        </>
      )}
      {section === 'password' && (
        <Grid margin="0.5rem">
          <InputPassword
            label={passwordLabel}
            value=""
            setValue={undefined}
            leftIcon={<LockOutlined fill={defaultFill} />}
          />
          <InputPassword
            label={newPasswordLabel}
            value=""
            setValue={undefined}
            leftIcon={<LockOutlined fill={defaultFill} />}
          />
          <InputPassword
            label={confirmPasswordLabel}
            value=""
            setValue={undefined}
            leftIcon={<LockOutlined fill={defaultFill} />}
          />
        </Grid>
      )}
    </div>
  );
};

export default SelectorList;
