import Loading from '@/components/loading';
import { getLanguage } from '@/utils/language';

export default function LoadingScreen() {
  return <Loading language={getLanguage()} />;
}
