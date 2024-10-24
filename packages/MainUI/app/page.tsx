'use client';

import Home from '../screens/Home';
import { Box } from '@mui/material';
import Layout from '../components/layout';

export default function HomePage() {
  return (
    <Layout>
      <Box padding={1}>
        <Home />
      </Box>
    </Layout>
  );
}
