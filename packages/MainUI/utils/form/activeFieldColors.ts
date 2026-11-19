/**
 * Color of the icons (clear, chevron, calendar) of a field that is focused or open: the text color of that state,
 * so the icons match the value and follow the focused background in both themes (light violet with dark text in
 * the light theme, dark violet with light text in the dark one). A fixed dark color disappeared on the dark one.
 */
export const ACTIVE_ICON_COLOR = "text-(--ui-field-focus-fg)";

/**
 * Color of the icons of a field at rest: 3:1 or more against the field background in both themes. Gray-400 was
 * fixed and fell to 2.7:1 in the dark theme.
 */
export const IDLE_ICON_COLOR = "text-(--color-transparent-neutral-60)";

/**
 * Color class of a field icon.
 *
 * @param active whether the field is focused or open
 * @returns the class of the icon color
 */
export const fieldIconColor = (active: boolean): string => (active ? ACTIVE_ICON_COLOR : IDLE_ICON_COLOR);
