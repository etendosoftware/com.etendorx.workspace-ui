import { TranslationKeys, Translations } from '../../ComponentLibrary/src/locales/types';

type Primitive = string;

export type NestedKeyOf<T> = T extends Primitive ? T : {
  [K in keyof T & (string | number)]: T[K] extends Primitive ? K : K | `${K}.${NestedKeyOf<T[K]>}`
}[keyof T & (string | number)];

export type TranslateFunction = <K extends NestedKeyOf<TranslationKeys>>(key: K) => string;

export type { TranslationKeys, Translations };
