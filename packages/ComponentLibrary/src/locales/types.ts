import type en from "./en";
import type es from "./es";

type Primitive = string;

export type NestedKeyOf<T> = T extends Primitive
  ? T
  : {
      [K in keyof T & (string | number)]: T[K] extends Primitive ? K : K | `${K}.${NestedKeyOf<T[K]>}`;
    }[keyof T & (string | number)];

export type TranslationKeys = NestedKeyOf<typeof en | typeof es>;

export type Language = "en_US" | "es_ES";

export type Translations = {
  [key in Language]: typeof en | typeof es;
};
