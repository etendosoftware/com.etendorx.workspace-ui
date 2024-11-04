import { API_METADATA_URL, MAX_ATTEMPTS } from '@workspaceui/etendohookbinder/api/constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import Spinner from '@workspaceui/componentlibrary/components/Spinner';
import { logger } from '../../utils/logger';
import { Button } from '@mui/material';

export default function SanityChecker(props: React.PropsWithChildren) {
  const [connected, setConnected] = useState(false);
  const checker = useRef<NodeJS.Timeout | number>(NaN);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleRetry = useCallback(() => {
    setAttempts(0);
    setError(false);
  }, []);

  useEffect(() => {
    const healthCheck = async () => {
      try {
        if (attempts < MAX_ATTEMPTS && !connected) {
          setAttempts(prev => prev + 1);
          const response = await fetch(API_METADATA_URL, {
            method: 'OPTIONS',
          });

          if (response.ok) {
            setAttempts(0);
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
        logger.warn('Could not connect to the API after ' + attempts + ' attempts');
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
  }, [attempts, connected]);

  if (connected) {
    return <>{props.children}</>;
  }

  return (
    <div className="center-all">
      {error ? (
        <Button variant="contained" onClick={handleRetry}>
          Retry
        </Button>
      ) : (
        <Spinner />
      )}
    </div>
  );
}
