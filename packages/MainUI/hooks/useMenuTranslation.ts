import type { NestedKeyOf } from "@workspaceui/componentlibrary/src/locales/types";
import type { TranslationKeys } from "./types";
import { useTranslation } from "./useTranslation";
import type { Menu } from "@workspaceui/api-client/src/api/types";

export const useMenuTranslation = () => {
  const { t } = useTranslation();

  const translateMenuItem = (item: Menu): string => {
    if (!item.name) return item._identifier || "";

    try {
      return item._identifier || t(item.name as NestedKeyOf<TranslationKeys>) || item.name;
    } catch {
      return item._identifier || item.name;
    }
  };

  return { translateMenuItem };
};
