import { useState } from 'react';
import {
  DataGrid,
  Table,
  TableV2,
  Tab,
  Chip,
  DragModal,
  Navbar,
  Profile,
  Button,
  Grid,
  TextInputBase,
  InputPassword
} from '@workspaceui/componentlibrary/src/components';
import List from '@mui/material/List';
import { Search } from '@mui/icons-material';
import MenuItem from '@mui/material/MenuItem';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { PRIMARY_0 } from '@workspaceui/componentlibrary/src/colors';
import Modal from '@workspaceui/componentlibrary/src/components/Modal';
import { TabContent } from '@workspaceui/componentlibrary/src/Interfaces';
import { MENU_ITEMS } from '@workspaceui/componentlibrary/src/components/Modal/mock';
import TextInputAutocomplete from '@workspaceui/componentlibrary/src/components/Input/TextInput/TextInputAutocomplete';
import { MOCK_AUTO_COMPLETE_TEXTS, MOCK_PLACEHOLDERS } from '@workspaceui/componentlibrary/src/components/Input/TextInput/TextInputAutocomplete/TextInputAutocomplete.mock';

const Home = () => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [disabledValue, setDisabledValue] = useState<string>('');
  const [passwordValue, setPasswordValue] = useState<string>('');
  const [inputBaseValue, setInputBaseValue] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

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
              onClick={() => console.log('click')}
            >
              Primary
            </Button>
            <Button
              sx={{ margin: '1rem' }}
              variant="contained"
            >
              Primary
            </Button>
            <Button
              sx={{ margin: '1rem' }}
              disabled={true}
              variant="contained"
            >
              Primary
            </Button>
            <Button
              sx={{ margin: '1rem' }}
              variant="outlined"
            >
              Primary
            </Button>
            <Button
              sx={{ margin: '1rem' }}
              disabled={true}
              variant="outlined"
            >
              Primary
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              sx={{ margin: '1rem' }}
              variant="contained"
              color="secondary"
              onClick={() => console.log('token')}
            >
              Secondary
            </Button>
            <Button
              sx={{ margin: '1rem' }}
              disabled={true}
              variant="contained"
              color="secondary"
            >
              Secondary
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              sx={{ margin: '1rem' }}
              variant="contained"
              color="tertiary"
            >
              Tertiary
            </Button>
            <Button
              sx={{ margin: '1rem' }}
              disabled={true}
              variant="contained"
              color="tertiary"
            >
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
      children: <DataGrid />
    },
    {
      title: '🧩 TableV2',
      children: <TableV2 />
    },
    {
      title: '🔍 Input',
      children: (
        <Grid
          sx={{
            backgroundColor: PRIMARY_0,
            padding: '1rem',
            borderRadius: '0.5rem'
          }}
          container
          spacing={2}
        >
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
              leftIcon={<LockOutlinedIcon />}
              rightIcon={<Search />}
              onRightIconClick={handleClickShowPassword}
              sx={{ marginTop: '1rem' }}
              value={inputBaseValue}
              setValue={setInputBaseValue}
              placeholder={MOCK_PLACEHOLDERS.SEARCH}
            />
            <InputPassword
              leftIcon={<LockOutlinedIcon />}
              value={passwordValue}
              setValue={setPasswordValue}
              label={MOCK_PLACEHOLDERS.PASSWORD_LABEL}
              sx={{ marginTop: '1rem' }}
            />
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
      children: <Chip />,
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
  ];

  return (
    <div className="container">
      <Tab tabArray={tabArray} />
    </div>
  );
};

export default Home;
