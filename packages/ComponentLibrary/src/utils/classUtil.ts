export const cleanDefaultClasses = (className: string, defaultClasses: string): string => {
  if (!className.trim()) {
    return defaultClasses;
  }

  const toArray = (s: string) => s.trim().split(/\s+/);

  const getKey = (cls: string): string | null => {
    const [, variant = '', base] = cls.match(/^([a-z]+:)?(text|bg|w|h|rounded)/) || [];
    return base && !(base === 'text' && cls.includes('[')) ? variant + base : null;
  };

  const userClasses = toArray(className);
  const userKeys = new Set(userClasses.map(getKey).filter(Boolean));

  const cleanedDefaults = toArray(defaultClasses).filter((c) => !userKeys.has(getKey(c)));

  return [...cleanedDefaults, ...userClasses].join(' ');
};
