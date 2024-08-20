import { Box, Table } from '@workspaceui/componentlibrary/src/components';
import { mockOrganizations } from '@workspaceui/storybook/mocks';
import styles from './styles';

const Home = () => {
  return (
    <Box sx={styles.container}>
      <Box height="100%" overflow="auto">
        <Table data={mockOrganizations} isTreeStructure={false} />
      </Box>
    </Box>
  );
};

export default Home;
