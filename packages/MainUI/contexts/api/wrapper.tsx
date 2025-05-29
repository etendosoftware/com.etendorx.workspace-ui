import { FALLBACK_URL } from '@/utils/constants';
import { connection } from 'next/server';
import ApiProvider from '.';

export default async function ApiProviderWrapper({ children }: React.PropsWithChildren) {
  await connection();

  const url = process.env.ETENDO_CLASSIC_URL || FALLBACK_URL;

  return <ApiProvider url={url}>{children}</ApiProvider>;
}
