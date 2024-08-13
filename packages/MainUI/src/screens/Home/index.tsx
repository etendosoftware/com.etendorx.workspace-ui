import { Table } from '@workspaceui/componentlibrary/src/components';
import { FlatData } from '@workspaceui/storybook/mocks';

const Home = () => {
  return (
    <Table
      data={FlatData}
      isTreeStructure={true}
      customLabels={{
        identificator: 'Home Identificator',
      }}
    />
  );
};

export default Home;
