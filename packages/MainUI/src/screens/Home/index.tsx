import { Table } from '@workspaceui/componentlibrary/src/components';
import { mockOrganizations } from '@workspaceui/storybook/mocks';

const Home = () => {
  return (
    <Table
      data={mockOrganizations}
      isTreeStructure={false}
      customLabels={{
        identificator: 'Home Identificator',
      }}
    />
  );
};

export default Home;
