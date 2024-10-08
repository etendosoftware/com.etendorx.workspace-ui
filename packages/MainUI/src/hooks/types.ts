import {
  TranslationKeys,
  Translations,
} from '../../../ComponentLibrary/src/locales/types';

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslateFunction = <K extends NestedKeyOf<TranslationKeys>>(
  key: K,
) => string;

export type { TranslationKeys, Translations };
