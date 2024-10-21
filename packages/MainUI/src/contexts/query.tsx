import { useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function QueryProvider(props: React.PropsWithChildren) {
  const queryClient = useRef(new QueryClient());

  return <QueryClientProvider client={queryClient.current}>{props.children}</QueryClientProvider>;
}
