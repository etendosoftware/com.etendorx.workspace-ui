import { API_LOGIN_URL, MAX_ATTEMPTS } from '@workspaceui/etendohookbinder/api/constants';
import { useEffect, useRef, useState } from 'react';
import { logger } from '../../utils/logger';
import Spinner from '@workspaceui/componentlibrary/components/Spinner';
import { Box } from '@mui/material';

export default function SanityChecker(props: React.PropsWithChildren) {
  const [connected, setConnected] = useState(false);
  const attempts = useRef(0);

  useEffect(() => {
    const f = async () => {
      try {
        if (attempts.current < MAX_ATTEMPTS) {
          attempts.current = attempts.current + 1;
          const response = await fetch(API_LOGIN_URL);

          if (response.ok) {
            attempts.current = 0;
            setConnected(true);
          }
        }
      } catch (e) {
        logger.warn('Could not connect to the API after ' + attempts.current + ' attempts');
        setTimeout(f, 5000);
      }
    };

    setTimeout(f);
  }, []);

  if (connected) {
    return <>{props.children}</>;
  } else {
    return (
      <Box flex={1}>
        <Spinner size="2rem" />
      </Box>
    );
  }
}
