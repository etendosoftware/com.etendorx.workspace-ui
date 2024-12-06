import en from './en';
import es from './es';

type Primitive = string;

export type NestedKeyOf<T> = T extends Primitive
  ? T
  : {
      [K in keyof T & (string | number)]: T[K] extends Primitive ? K : K | `${K}.${NestedKeyOf<T[K]>}`;
    }[keyof T & (string | number)];

export type TranslationKeys = NestedKeyOf<typeof en | typeof es>;

export type Language = 'es' | 'en';

export type Translations = {
  [key in Language]: typeof en | typeof es;
};
