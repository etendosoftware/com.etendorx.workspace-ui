import { useTranslation } from '@/hooks/useTranslation';
import { Checkbox, FormControl, FormControlLabel, Grid, styled, useTheme } from '@mui/material';
import { InputPassword } from '@workspaceui/componentlibrary/src/components';
import Select from '@workspaceui/componentlibrary/src/components/Input/Select';
import type { Option } from '@workspaceui/componentlibrary/src/components/Input/Select/types';
import { Item } from '@workspaceui/componentlibrary/src/components/enums';
import { useMemo, useState } from 'react';
import ClientIcon from '../../../../ComponentLibrary/src/assets/icons/github.svg';
import LockOutlined from '../../../../ComponentLibrary/src/assets/icons/lock.svg';
import OrganizationIcon from '../../../../ComponentLibrary/src/assets/icons/user.svg';
import WarehouseIcon from '../../../../ComponentLibrary/src/assets/icons/warehouse.svg';
import type { SelectorListProps } from '../types';
import { useStyle } from './styles';

const isOptionEqualToValue = (option: Option, value: Option) => option.id === value.id;

const SelectorList: React.FC<SelectorListProps> = ({
  section,
  onRoleChange,
  onOrgChange,
  onWarehouseChange,
  roles,
  selectedRole,
  selectedClient,
  selectedOrg,
  selectedWarehouse,
  onLanguageChange,
  selectedLanguage,
  languages,
  saveAsDefault,
  onSaveAsDefaultChange,
  translations,
  languagesFlags,
}) => {
  const { t } = useTranslation();
  const { styles, defaultFill } = useStyle();
  const theme = useTheme();
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');

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

  const isSystem = selectedRole?.id === '0';

  const clientOptions = useMemo(() => {
    if (!selectedRole || isSystem) return [];

    const client = roles.find((r) => r.id === selectedRole.value)?.client;
    return client ? [{ title: client, value: client, id: client }] : [];
  }, [roles, selectedRole, isSystem]);

  const organizationOptions = useMemo(() => {
    if (!selectedRole || isSystem) {
      return [];
    }

    const role = roles.find((r) => r.id === selectedRole.value);
    if (!role) return [];

    return role.organizations.map((org) => ({
      title: org.name,
      value: org.id,
      id: org.id,
    }));
  }, [roles, selectedRole, isSystem]);

  const warehouses = useMemo(() => {
    if (selectedRole && !isSystem) {
      const role = roles.find((r) => r.id === selectedRole.value);
      const org = role?.organizations.find((o) => o.id === selectedOrg.value);

      if (org?.warehouses.length) {
        return org.warehouses;
      }

      const uniqueWarehousesMap = new Map();

      if (role) {
        for (const org of role.organizations) {
          for (const warehouse of org.warehouses) {
            uniqueWarehousesMap.set(warehouse.id, warehouse);
          }
        }
      }

      return Array.from(uniqueWarehousesMap.values());
    }
    return [];
  }, [roles, selectedRole, selectedOrg, isSystem]);

  const roleOptions = useMemo(
    () =>
      roles?.map((role) => ({
        title: role.name,
        value: role.id,
        id: role.id,
      })),
    [roles],
  );

  const warehouseOptions = useMemo(
    () =>
      isSystem
        ? []
        : warehouses.map((warehouse) => ({
            title: warehouse.name,
            value: warehouse.id,
            id: warehouse.id,
          })),
    [isSystem, warehouses],
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
              id='role-select'
              title={Item.Role}
              options={roleOptions}
              value={selectedRole}
              onChange={onRoleChange}
              iconLeft={icons[Item.Role]}
              isOptionEqualToValue={isOptionEqualToValue}
            />
            <Select
              id='client-select'
              title={Item.Client}
              options={clientOptions}
              value={selectedClient}
              iconLeft={icons[Item.Client]}
              isOptionEqualToValue={isOptionEqualToValue}
              disabled={true}
            />
            <Select
              id='organization-select'
              title={Item.Organization}
              options={organizationOptions}
              value={selectedOrg}
              onChange={onOrgChange}
              iconLeft={icons[Item.Organization]}
              isOptionEqualToValue={isOptionEqualToValue}
              disabled={!selectedClient || isSystem}
            />
            <Select
              id='warehouse-select'
              title={Item.Warehouse}
              options={warehouseOptions}
              value={isSystem ? null : selectedWarehouse}
              onChange={onWarehouseChange}
              iconLeft={icons[Item.Warehouse]}
              disabled={!selectedOrg || isSystem}
              isOptionEqualToValue={isOptionEqualToValue}
            />
            <Select
              id='language-select'
              title={Item.Language}
              options={languageOptions}
              value={selectedLanguage}
              onChange={onLanguageChange}
              iconLeft={icons[Item.Language]}
              isOptionEqualToValue={isOptionEqualToValue}
            />
          </FormControl>
          <FormControlLabel
            control={<CustomCheckbox size='small' checked={saveAsDefault} onChange={onSaveAsDefaultChange} />}
            label={translations?.saveAsDefault}
          />
        </>
      )}
      {section === 'password' && (
        <Grid margin='0.5rem'>
          <form action='#' autoComplete='off'>
            <InputPassword
              label={t('common.notImplemented')}
              value={password}
              setValue={setPassword}
              leftIcon={<LockOutlined fill={defaultFill} />}
              autoComplete='new-password'
              disabled
            />
            <InputPassword
              label={t('common.notImplemented')}
              value={newPassword}
              setValue={setNewPassword}
              leftIcon={<LockOutlined fill={defaultFill} />}
              autoComplete='new-password'
              disabled
            />
            <InputPassword
              label={t('common.notImplemented')}
              value={newPasswordConfirmation}
              setValue={setNewPasswordConfirmation}
              leftIcon={<LockOutlined fill={defaultFill} />}
              autoComplete='new-password'
              disabled
            />
          </form>
        </Grid>
      )}
    </div>
  );
};

export default SelectorList;
