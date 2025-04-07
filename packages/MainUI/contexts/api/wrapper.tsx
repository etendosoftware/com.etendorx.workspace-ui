import { connection } from 'next/server';
import ApiProvider from '.';
import { FALLBACK_URL } from '@/utils/constants';

export default async function ApiProviderWrapper({ children }: React.PropsWithChildren) {
  await connection();

  return <ApiProvider url={process.env['ETENDO_CLASSIC_URL'] || FALLBACK_URL}>{children}</ApiProvider>;
}
