import { NestedKeyOf } from '@workspaceui/componentlibrary/src/locales/types';
import { TranslationKeys } from './types';
import { useTranslation } from './useTranslation';
import { Menu } from '@workspaceui/etendohookbinder/src/api/types';

export const useMenuTranslation = () => {
  const { t } = useTranslation();

  const translateMenuItem = (item: Menu): string => {
    if (!item.name) return item._identifier || '';

    try {
      return item._identifier || t(item.name as NestedKeyOf<TranslationKeys>) || item.name;
    } catch {
      return item._identifier || item.name;
    }
  };

  return { translateMenuItem };
};
