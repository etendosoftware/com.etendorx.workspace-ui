'use client';

import Layout from '@/components/layout';
import Home from '@/screens/Home';
import { Box } from '@mui/material';

export default function HomePage() {
  return (
    <Layout>
      <Box padding={1}>
        <Home />
      </Box>
    </Layout>
  );
}
