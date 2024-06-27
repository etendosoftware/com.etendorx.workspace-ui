import { useState } from 'react';
import {
  DataGrid,
  Table,
  TableV2,
  Tab,
  DragModal,
  Navbar,
  Profile,
  NotificationButton,
  ToggleChip,
  NotificationModal,
  Button,
  Grid,
  NotificationStates,
} from '@workspaceui/componentlibrary/src/components';
import logo from '../../assets/react.svg';
import { TabContent } from '@workspaceui/componentlibrary/src/interfaces';
import { NOTIFICATIONS } from '@workspaceui/componentlibrary/src/components/NotificationItem/mock';
import { notificationsStates } from '@workspaceui/componentlibrary/src/components/NotificationItemAllStates/mock';

const Home = () => {
  const [isActive, setIsActive] = useState(false);

  const handleToggle = () => {
    setIsActive(prevState => !prevState);
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
      title: 'Notification Item States',
      children: (
        <Grid container spacing={1}>
          <Grid item>
            <NotificationStates
              notifications={notificationsStates}
              type="informatives"
            />
          </Grid>
          <Grid item>
            <NotificationStates
              notifications={notificationsStates}
              type="withButtons"
            />
          </Grid>
          <Grid item>
            <NotificationStates
              notifications={notificationsStates}
              type="withButtonsAndTags"
            />
          </Grid>
          <Grid item>
            <NotificationStates
              notifications={notificationsStates}
              type="tags"
            />
            ,
          </Grid>
          <Grid item>
            <NotificationStates
              notifications={notificationsStates}
              type="avatar"
            />
          </Grid>
        </Grid>
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
