const QUOTE = '"';
const FIELD_SEPARATOR = ",";
const LINE_BREAK = /\r?\n/;

/**
 * Splits one CSV line into its values: quoted values may hold the separator (`"Sleep Well Hotels, Co."`)
 * and escape a quote by doubling it (`""`).
 */
export function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === QUOTE && inQuotes && line[index + 1] === QUOTE) {
      value += QUOTE;
      index++;
    } else if (char === QUOTE) {
      inQuotes = !inQuotes;
    } else if (char === FIELD_SEPARATOR && !inQuotes) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}

/** Rows of a CSV file (the exported grid: one record per line), skipping empty lines. */
export function parseCsv(text: string): string[][] {
  return text
    .split(LINE_BREAK)
    .filter((line) => line.trim() !== "")
    .map(parseCsvLine);
}

/** Values of one column of a parsed CSV, found by its header. */
export function csvColumn(rows: string[][], header: string): string[] {
  const [headers = [], ...records] = rows;
  const index = headers.indexOf(header);
  if (index < 0) {
    throw new Error(`The CSV has no column "${header}": ${headers.join(", ")}`);
  }
  return records.map((record) => record[index]);
}
