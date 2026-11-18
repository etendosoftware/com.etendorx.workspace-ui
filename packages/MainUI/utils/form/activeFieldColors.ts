/**
 * Color of the icons (clear, chevron, calendar) of a field that is focused or open.
 *
 * Such a field has a fixed light background (`#ece8f6`) in both themes, so the icon cannot follow
 * `--color-baseline-100`: in the dark theme that token is almost white and the icon disappears on it. It takes the
 * same dark text color as the field instead, which is also fixed.
 */
export const ACTIVE_ICON_COLOR = "text-[#2a1757]";
