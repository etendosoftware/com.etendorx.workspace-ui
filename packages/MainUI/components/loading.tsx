import { CircularProgress } from '@mui/material';
import { DEFAULT_LANGUAGE, Language } from '@workspaceui/componentlibrary/src/locales';
import { t } from '@/utils/language';

export default function Loading({ language }: { language?: Language }) {
  return (
    <div className="h-full mx-auto flex flex-col items-center justify-center">
      <CircularProgress />
      <span>{t(language ?? DEFAULT_LANGUAGE, 'common.loading')}</span>
    </div>
  );
}

export { Loading };
