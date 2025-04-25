'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '../../hooks/useUserContext';
import Login from '../../components/Forms/Login';
import Loading from '@/components/loading';

export default function LoginPage() {
  const [error, setError] = useState('');
  const router = useRouter();
  const { token, login } = useUserContext();

  const handleLogin = useCallback(
    async (username: string, password: string) => {
      try {
        await login(username, password);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [login],
  );

  useEffect(() => {
    if (token) {
      router.push('/');
    }
  }, [router, token]);

  if (token) {
    return <Loading />;
  }

  return <Login title="Etendo" onSubmit={handleLogin} error={error} />;
}
