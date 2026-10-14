// The form's record position indicator ("3 / 100") read by the form-next-5 step of bench.mjs.

/** "3 / 100" -> { current: 3, total: 100 }; null when there is no position ("- / -"). */
export function parseRecordPosition(text) {
  const [current, total] = (text.match(/\d+/g) ?? []).map(Number);
  return total === undefined ? null : { current, total };
}

/**
 * How many Next clicks the form allows from the current position, up to `wanted`. A window with fewer records
 * left would leave the Next button disabled and the click waiting until the timeout.
 */
export function availableNextClicks(text, wanted) {
  const position = parseRecordPosition(text);
  return position ? Math.max(0, Math.min(wanted, position.total - position.current)) : 0;
}
