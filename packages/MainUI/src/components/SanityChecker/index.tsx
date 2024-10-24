'use client';

import { API_METADATA_URL, MAX_ATTEMPTS } from '@workspaceui/etendohookbinder/api/constants';
import { useEffect, useRef, useState } from 'react';
import { logger } from '../../../src/utils/logger';
import Spinner from '@workspaceui/componentlibrary/components/Spinner';
import { Box, Button } from '@workspaceui/componentlibrary/components';

export default function SanityChecker(props: React.PropsWithChildren) {
  const [connected, setConnected] = useState(false);
  const checker = useRef<NodeJS.Timeout | number>(NaN);
  const [error, setError] = useState(false);
  const attempts = useRef(0);

  useEffect(() => {
    const healthCheck = async () => {
      try {
        if (attempts.current < MAX_ATTEMPTS) {
          attempts.current = attempts.current + 1;
          const response = await fetch(API_METADATA_URL, {
            method: 'OPTIONS',
          });

          if (response.ok) {
            attempts.current = 0;
            setConnected(true);

            if (checker.current) {
              clearInterval(checker.current);
            }
          } else {
            logger.warn('Error while trying to connect to API ', response);
          }
        } else {
          setError(true);
        }
      } catch (e) {
        logger.warn('Could not connect to the API after ' + attempts.current + ' attempts');
        setError(true);
      }
    };

    healthCheck();
    checker.current = setInterval(healthCheck, 1000);

    return () => {
      if (checker.current) {
        clearInterval(checker.current);
      }
    };
  }, []);

  if (connected) {
    return <>{props.children}</>;
  } else if (error) {
    return <Button>Retry</Button>;
  } else {
    return (
      <Box>
        <Spinner />
      </Box>
    );
  }
}
