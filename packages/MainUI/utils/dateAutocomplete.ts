/**
 * Parses format string to get indices of day, month, and year positions
 */
const parseFormatIndices = (format: string): { dayIndex: number; monthIndex: number; yearIndex: number } => {
  const formatLower = format.toLowerCase();
  const formatParts = formatLower.split(/[\/\.\-]/);

  return {
    dayIndex: formatParts.findIndex((p) => p.includes("d")),
    monthIndex: formatParts.findIndex((p) => p.includes("m")),
    yearIndex: formatParts.findIndex((p) => p.includes("y")),
  };
};

/**
 * Handles single part input (day only)
 */
const handleSinglePart = (parts: string[], currentYear: number, currentMonth: number) => {
  const day = Number.parseInt(parts[0], 10);
  return { day, month: currentMonth, year: currentYear };
};

/**
 * Handles two part input (day/month or month/day based on format)
 */
const handleTwoParts = (parts: string[], dayIndex: number, monthIndex: number, currentYear: number) => {
  let day: number;
  let month: number;

  if (dayIndex < monthIndex) {
    // dd/mm format
    day = Number.parseInt(parts[0], 10);
    month = Number.parseInt(parts[1], 10) - 1;
  } else {
    // mm/dd format
    month = Number.parseInt(parts[0], 10) - 1;
    day = Number.parseInt(parts[1], 10);
  }

  return { day, month, year: currentYear };
};

/**
 * Assigns a date component value based on format type
 */
const assignDateComponent = (
  type: string | undefined,
  value: number,
  state: { day: number; month: number; year: number }
) => {
  if (type === "d") state.day = value;
  else if (type === "m") state.month = value - 1;
  else if (type === "y") state.year = value;
};

/**
 * Handles three or more part input (full date with format mapping)
 */
const handleThreeOrMoreParts = (
  parts: string[],
  dayIndex: number,
  monthIndex: number,
  yearIndex: number,
  currentYear: number
) => {
  const state = { day: 1, month: 0, year: currentYear };
  const map = new Map<number, string>();

  if (dayIndex !== -1) map.set(dayIndex, "d");
  if (monthIndex !== -1) map.set(monthIndex, "m");
  if (yearIndex !== -1) map.set(yearIndex, "y");

  for (let i = 0; i <= 2 && i < parts.length; i++) {
    const type = map.get(i);
    const value = Number.parseInt(parts[i], 10);
    assignDateComponent(type, value, state);
  }

  // Handle 2-digit years (assume 20xx)
  if (state.year < 100) {
    state.year += 2000;
  }

  return state;
};

/**
 * Validates date components and returns null if invalid
 */
const validateDateComponents = (day: number, month: number, year: number): boolean => {
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (month < 0 || month > 11) return false;
  return true;
};

/**
 * Validates that the created date hasn't rolled over to different values
 */
const isValidDateObject = (date: Date, year: number, month: number, day: number): boolean => {
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
};

/**
 * Autocompletes a partial date string into a full Date object.
 * Supports:
 * - Day only (e.g., "15" -> 15th of current month/year)
 * - Day/Month (e.g., "15/08" -> 15th of August of current year)
 * - Full date (e.g., "15/08/2023" -> 15th of August 2023)
 *
 * Handles separators: /, ., -
 * Respects the provided format (e.g., "mm/dd/yyyy" vs "dd/mm/yyyy")
 *
 * @param input The partial date string
 * @param format The expected date format (e.g., "dd/mm/yyyy"), defaults to "dd/mm/yyyy"
 * @returns A Date object if valid, or null if invalid
 */
export const autocompleteDate = (input: string, format = "dd/mm/yyyy") => {
  if (!input || !input.trim()) return null;

  const cleanInput = input.trim();
  const parts = cleanInput.split(/[\/\.\-]/);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const { dayIndex, monthIndex, yearIndex } = parseFormatIndices(format);

  let day: number;
  let month: number;
  let year: number;

  if (parts.length === 1) {
    ({ day, month, year } = handleSinglePart(parts, currentYear, currentMonth));
  } else if (parts.length === 2) {
    ({ day, month, year } = handleTwoParts(parts, dayIndex, monthIndex, currentYear));
  } else if (parts.length >= 3) {
    ({ day, month, year } = handleThreeOrMoreParts(parts, dayIndex, monthIndex, yearIndex, currentYear));
  } else {
    return null;
  }

  if (!validateDateComponents(day, month, year)) return null;

  const date = new Date(year, month, day);

  if (!isValidDateObject(date, year, month, day)) return null;

  return date;
};
