/**
 * Merges user-defined classes with default classes, removing default classes that
 * conflict with user classes based on specific Tailwind CSS utility prefixes.
 *
 * This approach avoids regular expressions, significantly reducing per-class processing cost,
 * especially in frequent renders or large lists of components where performance matters.
 *
 * @param defaultClasses - A string of default CSS classes (e.g. Tailwind utilities).
 * @param className - A string of user-provided CSS classes that override defaults.
 * @returns A combined string of classes with user classes taking precedence over defaults.
 */
export const cleanDefaultClasses = (defaultClasses: string, className = ""): string => {
  if (!className.trim()) {
    return defaultClasses;
  }

  const toArray = (s: string) => s.trim().split(/\s+/);

  const getKey = (cls: string): string | null => {
    const [, variant = "", base] = cls.match(/^([a-z]+:)?(text|bg|w|h|rounded)/) || [];
    return base && !(base === "text" && cls.includes("[")) ? variant + base : null;
  };

  const userClasses = toArray(className);
  const userKeys = new Set(userClasses.map(getKey).filter(Boolean));

  const cleanedDefaults = toArray(defaultClasses).filter((c) => !userKeys.has(getKey(c)));

  return [...cleanedDefaults, ...userClasses].join(" ");
};
