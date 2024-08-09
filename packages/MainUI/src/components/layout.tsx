import Navigation from './navigation';
import { Drawer } from '@workspaceui/componentlibrary/src/components';
import EtendoLogotype from '../assets/etendo-logotype.png';
import { sectionGroups } from '../mocks';
import Box from '@mui/material/Box';

export default function Layout(props: React.PropsWithChildren) {
  return (
    <>
      <Drawer
        headerImage={EtendoLogotype}
        headerTitle="Etendo"
        sectionGroups={sectionGroups}
      />
      <Box
        maxWidth="100%"
        maxHeight="100%"
        overflow="auto"
        flex={1}
        display="flex"
        flexDirection="column">
        <Navigation />
        {props.children}
      </Box>
    </>
  );
}
