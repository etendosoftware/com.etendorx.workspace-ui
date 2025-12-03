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
export const autocompleteDate = (input: string, format: string = "dd/mm/yyyy"): Date | null => {
  if (!input || !input.trim()) return null;

  const cleanInput = input.trim();
  // Split by common separators
  const parts = cleanInput.split(/[\/\.\-]/);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  let day: number;
  let month: number;
  let year: number;
  
  // Determine order from format
  // We look for 'd', 'm', 'y' positions
  const formatLower = format.toLowerCase();
  const formatParts = formatLower.split(/[\/\.\-]/);
  
  const dayIndex = formatParts.findIndex(p => p.includes('d'));
  const monthIndex = formatParts.findIndex(p => p.includes('m'));
  const yearIndex = formatParts.findIndex(p => p.includes('y'));

  if (parts.length === 1) {
    // Day only - always treat single number as day
    const val = parseInt(parts[0], 10);
    day = val;
    month = currentMonth;
    year = currentYear;
  } else if (parts.length === 2) {
    // Two parts: could be Day/Month or Month/Day depending on format
    // We assume the user is typing the first two parts of the format
    // e.g. if format is mm/dd/yyyy, user types mm/dd
    // if format is dd/mm/yyyy, user types dd/mm
    // if format is yyyy/mm/dd, user types yyyy/mm (less common for autocomplete but logical)
    
    // However, the requirement says: "if it comes mm/dd/yyyy from the browser, the first entered should be the month then the day"
    
    // Let's map the input parts to the format parts order
    // But we only have 2 parts.
    // If format starts with Year, we might be in trouble if we assume Day/Month.
    // Let's assume standard Day/Month or Month/Day formats.
    
    if (dayIndex < monthIndex) {
        // dd/mm format
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
    } else {
        // mm/dd format
        month = parseInt(parts[0], 10) - 1;
        day = parseInt(parts[1], 10);
    }
    year = currentYear;
  } else if (parts.length >= 3) {
    // Full date - map parts to format indices
    // We need to handle cases where indices might be -1 (though unlikely for valid format)
    // or if we have more parts than format (ignore extra)
    
    // Create a map of index -> type
    const map = new Map<number, string>();
    if (dayIndex !== -1) map.set(dayIndex, 'd');
    if (monthIndex !== -1) map.set(monthIndex, 'm');
    if (yearIndex !== -1) map.set(yearIndex, 'y');
    
    // We need to assign parts based on the sorted indices of the format
    // e.g. format "mm/dd/yyyy" -> indices: m=0, d=1, y=2
    // input "08/15/2023" -> parts[0]=08, parts[1]=15, parts[2]=2023
    
    // Default values
    day = 1;
    month = 0;
    year = currentYear;

    if (map.has(0)) {
        const type = map.get(0);
        const val = parseInt(parts[0], 10);
        if (type === 'd') day = val;
        else if (type === 'm') month = val - 1;
        else if (type === 'y') year = val;
    }
    
    if (map.has(1) && parts.length > 1) {
        const type = map.get(1);
        const val = parseInt(parts[1], 10);
        if (type === 'd') day = val;
        else if (type === 'm') month = val - 1;
        else if (type === 'y') year = val;
    }
    
    if (map.has(2) && parts.length > 2) {
        const type = map.get(2);
        const val = parseInt(parts[2], 10);
        if (type === 'd') day = val;
        else if (type === 'm') month = val - 1;
        else if (type === 'y') year = val;
    }

    // Handle 2-digit years (assume 20xx)
    if (year < 100) {
      year += 2000;
    }
  } else {
    return null;
  }

  // Validate components
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (month < 0 || month > 11) return null;

  const date = new Date(year, month, day);

  // Validate that the date components match (handles 31/02 -> invalid, but Date object rolls over)
  // We want strict validation
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }

  return date;
};
