import { NestedKeyOf } from '@workspaceui/mainui/hooks/types';
import en from './en';
import es from './es';

export type TranslationKeys = NestedKeyOf<typeof en | typeof es>;

export type Language = 'es' | 'en';

export type Translations = {
  [key in Language]: typeof en | typeof es;
};
