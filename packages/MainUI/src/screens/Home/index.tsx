import { DataGrid, Table, TableV2, Button, Grid, Tab, TextInputBase } from '@workspaceui/componentlibrary/src/components';
import { TabContent } from '@workspaceui/componentlibrary/src/Interfaces';
import { PRIMARY_0 } from '@workspaceui/componentlibrary/src/colors';
import { MOCK_AUTO_COMPLETE_TEXTS, MOCK_PLACEHOLDERS } from '@workspaceui/componentlibrary/src/components/Input/TextInput/TextInputAutocomplete/TextInputAutocomplete.mock';
import { MENU_ITEMS } from '@workspaceui/componentlibrary/src/components/Modal/mock';
import Modal from '@workspaceui/componentlibrary/src/components/Modal';
import List from '@mui/material/List';
import MenuItem from '@mui/material/MenuItem';
import { useState } from 'react';
import TextInputAutocomplete from '@workspaceui/componentlibrary/src/components/Input/TextInput/TextInputAutocomplete';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material';

const Home = () => {
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
            <Button sx={{ margin: '1rem' }} variant="text" onClick={() => console.log('click')}>
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
            <Button sx={{ margin: '1rem' }} variant="contained" color="secondary" onClick={() => console.log('token')}>
              Secondary
            </Button>
            <Button sx={{ margin: '1rem' }} disabled={true} variant="contained" color="secondary">
              Secondary
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button sx={{ margin: '1rem' }} variant="contained" color="tertiary">
              Tertiary
            </Button>
            <Button sx={{ margin: '1rem' }} disabled={true} variant="contained" color="tertiary">
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
    { title: '⚡️ Data Grid', children: <DataGrid /> },
    { title: '🧩 TableV2', children: <TableV2 /> },
    {
      title: '🔍 Input',
      children: (
        <Grid sx={{ backgroundColor: PRIMARY_0, padding: '1rem', borderRadius: '0.5rem' }} container spacing={2}>
          <Grid item xs={12}>
            <TextInputAutocomplete autoCompleteTexts={MOCK_AUTO_COMPLETE_TEXTS} placeholder={MOCK_PLACEHOLDERS.SEARCH} />
            <TextInputAutocomplete placeholder={MOCK_PLACEHOLDERS.DISABLED} sx={{ marginTop: '1rem' }} disabled />
            <TextInputBase
              leftIcon={<LockOutlinedIcon />}
              rightIcon={showPassword ? <VisibilityOutlined /> : <VisibilityOffOutlined />}
              onRightIconClick={handleClickShowPassword}
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
              <MenuItem key={item.key}>{item.label}</MenuItem>
            ))}
          </List>
        </Modal>
      ),
    },
  ];

  return (
    <div className="container">
      <Tab tabArray={tabArray} />
    </div>
  );
};

export default Home;
