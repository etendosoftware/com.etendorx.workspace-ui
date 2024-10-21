import { API_METADATA_URL, MAX_ATTEMPTS } from '@workspaceui/etendohookbinder/api/constants';
import { useEffect, useRef, useState } from 'react';
import { logger } from '../../utils/logger';
import Spinner from '@workspaceui/componentlibrary/components/Spinner';

export default function SanityChecker(props: React.PropsWithChildren) {
  const [connected, setConnected] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checker = useRef<any>();
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
            clearInterval(checker.current);
          }
        }
      } catch (e) {
        logger.warn('Could not connect to the API after ' + attempts.current + ' attempts');
      }
    };

    healthCheck();
    checker.current = setInterval(healthCheck, 2000);

    return () => {
      clearInterval(checker.current);
    };
  }, []);

  if (connected) {
    return <>{props.children}</>;
  }

  return <Spinner />;
}
