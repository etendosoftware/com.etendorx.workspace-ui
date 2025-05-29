import type { Translations, Language } from './types';
import es_ES from './es';
import en_US from './en';

const DEFAULT_LANGUAGE: Language = 'en_US';
const translations: Translations = {
  es_ES,
  en_US,
};

export default translations;
export { DEFAULT_LANGUAGE, translations };
export type { Language, Translations };
