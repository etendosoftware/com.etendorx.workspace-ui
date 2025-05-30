import { DEFAULT_LANGUAGE, translations, type Language } from "@workspaceui/componentlibrary/src/locales";

export const t = (
  language: Language,
  key: string,
  value: unknown = translations[language] ?? translations[DEFAULT_LANGUAGE],
): string => {
  if (!language) {
    language = DEFAULT_LANGUAGE;
  }

  const keys = key.split(".");
  const [currentKey, ...remainingKeys] = keys;

  if (typeof value !== "object" || value === null || !(currentKey in value)) {
    return key;
  }

  const nextValue = value[currentKey as keyof typeof value];

  if (remainingKeys.length === 0) {
    return typeof nextValue === "string" ? nextValue : key;
  }

  return t(language, remainingKeys.join("."), nextValue);
};

export const getLanguage = (): Language => {
  if (typeof window !== "undefined") {
    const savedLanguage = localStorage.getItem("currentLanguage");

    return (savedLanguage as Language) || DEFAULT_LANGUAGE;
  }

  return DEFAULT_LANGUAGE;
};
