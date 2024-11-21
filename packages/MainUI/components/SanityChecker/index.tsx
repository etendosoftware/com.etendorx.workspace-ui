import { API_METADATA_URL, MAX_ATTEMPTS } from '@workspaceui/etendohookbinder/src/api/constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { logger } from '../../utils/logger';
import { Button } from '@mui/material';

export default function SanityChecker(props: React.PropsWithChildren) {
  const [connected, setConnected] = useState(false);
  const checker = useRef<number>(NaN);
  const [error, setError] = useState(false);
  const attempts = useRef(0);

  const handleRetry = useCallback(() => {
    clearTimeout(checker.current);
    attempts.current = 0;
    setConnected(false);
    setError(false);
  }, []);

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

        if (attempts.current >= MAX_ATTEMPTS) {
          setError(true);
        }
      }
    };

    healthCheck();
    checker.current = window.setInterval(healthCheck, 1000);

    return () => {
      if (checker.current) {
        clearInterval(checker.current);
      }
    };
  }, [error]);

  if (connected) {
    return <>{props.children}</>;
  }

  return (
    <div className="center-all">
      {error ? (
        <Button variant="contained" color="warning" onClick={handleRetry}>
          Retry
        </Button>
      ) : (
        <Spinner />
      )}
    </div>
  );
}
