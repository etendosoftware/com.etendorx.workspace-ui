import { TranslationKeys, Translations, NestedKeyOf } from '../../ComponentLibrary/src/locales/types';

export type TranslateFunction = <K extends NestedKeyOf<TranslationKeys>>(key: K) => string;

export type { TranslationKeys, Translations };
