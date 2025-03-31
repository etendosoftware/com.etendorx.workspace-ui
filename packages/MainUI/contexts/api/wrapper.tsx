import { getApiUrl } from '@/app/actions';
import ApiProvider from '.';

export default async function ApiProviderWrapper({ children }: React.PropsWithChildren) {
  return <ApiProvider url={await getApiUrl()}>{children}</ApiProvider>;
}
