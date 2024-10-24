'use client';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '@workspaceui/componentlibrary/components/Forms/Login';
import { useUserContext } from '../../hooks/useUserContext';

export default function LoginPage() {
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useUserContext();

  const handleLogin = useCallback(
    async (username: string, password: string) => {
      try {
        await login(username, password);
        router.push('/');
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [login, router],
  );

  return <Login title="Etendo" onSubmit={handleLogin} error={error} />;
}
