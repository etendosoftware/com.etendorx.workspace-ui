import { useEffect, useState } from 'react';
import {
  DataGrid,
  Table,
  TableV2,
  Tab,
  Tag,
  DragModal,
  Navbar,
  Profile,
  Waterfall,
  ConfigurationModal,
  NotificationButton,
  ToggleChip,
  NotificationModal,
  SecondaryTabs,
  Button,
  Grid,
  TextInputBase,
  InputPassword,
  SearchInputWithVoice,
  Box,
} from '@workspaceui/componentlibrary/src/components';
import List from '@mui/material/List';
import {
  CheckOutlined,
  Error,
  InfoOutlined,
  LockOutlined,
  Search,
} from '@mui/icons-material';
import MenuItem from '@mui/material/MenuItem';
import logo from '../../assets/react.svg';
import { sectionsModal } from '../../../../ComponentLibrary/src/components/ConfigurationModal/mock';
import { PRIMARY_0 } from '@workspaceui/componentlibrary/src/colors';
import Modal from '@workspaceui/componentlibrary/src/components/Modal';
import { TabContent } from '@workspaceui/componentlibrary/src/Interfaces';
import { MENU_ITEMS } from '@workspaceui/componentlibrary/src/components/Modal/mock';
import TextInputAutocomplete from '@workspaceui/componentlibrary/src/components/Input/TextInput/TextInputAutocomplete';
import {
  MOCK_AUTO_COMPLETE_TEXTS,
  MOCK_PLACEHOLDERS,
} from '@workspaceui/componentlibrary/src/components/Input/TextInput/TextInputAutocomplete/TextInputAutocomplete.mock';
import { TABS_CONFIG } from '@workspaceui/componentlibrary/src/components/SecondaryTabs/constants/mock';
import { NOTIFICATIONS } from '@workspaceui/componentlibrary/src/components/NotificationItem/mock';

const Home = () => {
  const [isActive, setIsActive] = useState(false);
  const [tabsConfig, setTabsConfig] = useState(TABS_CONFIG);

  useEffect(() => {
    const timer = setTimeout(() => {
      const updatedTabs = tabsConfig.map(tab => ({
        ...tab,
        isLoading: false,
      }));
      setTabsConfig(updatedTabs);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleToggle = () => {
    setIsActive(prevState => !prevState);
  };

  const [micValue, setMicValue] = useState<string>('');
  const [searchValue, setSearchValue] = useState<string>('');
  const [disabledValue, setDisabledValue] = useState<string>('');
  const [passwordValue, setPasswordValue] = useState<string>('');
  const [inputBaseValue, setInputBaseValue] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleVoiceClick = () => {
    console.log('Voice button clicked');
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const tabArray: TabContent[] = [
    {
      title: '🎹 Buttons',
      children: (
        <Grid container spacing={2}>
          <Grid item xs={12} spacing={2}>
            <Button
              sx={{ margin: '1rem' }}
              variant="text"
              onClick={() => console.log('click')}>
              Primary
            </Button>
            <Button sx={{ margin: '1rem' }} variant="contained">
              Primary
            </Button>
            <Button sx={{ margin: '1rem' }} disabled={true} variant="contained">
              Primary
            </Button>
            <Button sx={{ margin: '1rem' }} variant="outlined">
              Primary
            </Button>
            <Button sx={{ margin: '1rem' }} disabled={true} variant="outlined">
              Primary
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              sx={{ margin: '1rem' }}
              variant="contained"
              color="secondary"
              onClick={() => console.log('token')}>
              Secondary
            </Button>
            <Button
              sx={{ margin: '1rem' }}
              disabled={true}
              variant="contained"
              color="secondary">
              Secondary
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              sx={{ margin: '1rem' }}
              variant="contained"
              color="tertiary">
              Tertiary
            </Button>
            <Button
              sx={{ margin: '1rem' }}
              disabled={true}
              variant="contained"
              color="tertiary">
              Tertiary
            </Button>
          </Grid>
        </Grid>
      ),
    },
    {
      title: '📦 Simple Table',
      children: <Table />,
    },
    {
      title: '⚡️ Data Grid',
      children: <DataGrid />,
    },
    {
      title: '🧩 TableV2',
      children: <TableV2 />,
    },
    {
      title: '🔍 Input',
      children: (
        <Grid
          sx={{
            backgroundColor: PRIMARY_0,
            padding: '1rem',
            borderRadius: '0.5rem',
          }}
          container
          spacing={2}>
          <Grid item xs={12}>
            <TextInputAutocomplete
              value={searchValue}
              setValue={setSearchValue}
              autoCompleteTexts={MOCK_AUTO_COMPLETE_TEXTS}
              placeholder={MOCK_PLACEHOLDERS.SEARCH}
            />
            <TextInputAutocomplete
              value={disabledValue}
              setValue={setDisabledValue}
              placeholder={MOCK_PLACEHOLDERS.DISABLED}
              sx={{ marginTop: '1rem' }}
              disabled
            />
            <TextInputBase
              leftIcon={<LockOutlined />}
              rightIcon={<Search />}
              onRightIconClick={handleClickShowPassword}
              sx={{ marginTop: '1rem' }}
              value={inputBaseValue}
              setValue={setInputBaseValue}
              placeholder={MOCK_PLACEHOLDERS.SEARCH}
            />
            <InputPassword
              leftIcon={<LockOutlined />}
              value={passwordValue}
              setValue={setPasswordValue}
              label={MOCK_PLACEHOLDERS.PASSWORD_LABEL}
              sx={{ marginTop: '1rem' }}
            />
            <Box sx={{ marginTop: '1rem' }}>
              <SearchInputWithVoice
                value={micValue}
                setValue={setMicValue}
                placeholder={MOCK_PLACEHOLDERS.SEARCH}
                onVoiceClick={handleVoiceClick}
              />
            </Box>
          </Grid>
        </Grid>
      ),
    },
    {
      title: 'Modal',
      children: (
        <Modal height={300} width={400}>
          <List>
            {MENU_ITEMS.map(item => (
              <MenuItem
                key={item.key}
                sx={{
                  '&:hover': {
                    color: '#242D93',
                  },
                  display: 'flex',
                  alignItems: 'center',
                }}>
                <span style={{ marginRight: '0.5rem' }}>{item.emoji}</span>
                <span>{item.label}</span>
              </MenuItem>
            ))}
          </List>
        </Modal>
      ),
    },
    {
      title: 'Toggle Chip',
      children: <ToggleChip isActive={isActive} onToggle={handleToggle} />,
    },
    {
      title: 'Dnd Modal',
      children: <DragModal />,
    },
    {
      title: 'Navbar',
      children: <Navbar />,
    },
    {
      title: 'Profile Modal',
      children: <Profile />,
    },
    {
      title: 'Waterfall Modal',
      children: <Waterfall />,
    },
    {
      title: 'Configuration Modal',
      children: (
        <ConfigurationModal
          icon={logo}
          title={{ icon: logo, label: 'Apariencia' }}
          linkTitle={{ label: 'Ver todos los ajustes', url: '/settings' }}
          sections={sectionsModal}
          onChangeSelect={console.log}
        />
      ),
    },
    {
      title: 'Notification Button',
      children: <NotificationButton notifications={NOTIFICATIONS} />,
    },
    {
      title: 'Notification Modal',
      children: (
        <NotificationButton notifications={NOTIFICATIONS}>
          <NotificationModal
            title={{ icon: logo, label: 'Notificaciones' }}
            linkTitle={{ label: 'Marcar todas como leídas', url: '/home' }}
            emptyStateImageAlt="Sin Notificaciones"
            emptyStateMessage="No tienes notificaciones"
            emptyStateDescription="¡Genial! Estás al día con todo. Te notificaremos aquí si hay algo nuevo."
            actionButtonLabel="Configurar notificaciones"
          />
        </NotificationButton>
      ),
    },
    {
      title: 'Tag Variants',
      children: (
        <Grid container spacing={2}>
          <Grid item>
            <Tag type="success" icon={<InfoOutlined />} label="Registrado" />
          </Grid>
          <Grid item>
            <Tag type="primary" label="Registrado" />
          </Grid>
          <Grid item>
            <Tag
              type="warning"
              icon={<CheckOutlined />}
              label="Período Cerrado"
            />
          </Grid>
          <Grid item>
            <Tag type="error" icon={<Error />} label="Anulado" />
          </Grid>
          <Grid item>
            <Tag type="draft" label="En Borrador" />
          </Grid>
        </Grid>
      ),
    },
    {
      title: 'Secondary Tabs',
      children: <SecondaryTabs tabsConfig={tabsConfig} />,
    },
  ];

  return (
    <div className="container">
      <Tab tabArray={tabArray} />
    </div>
  );
};

export default Home;
