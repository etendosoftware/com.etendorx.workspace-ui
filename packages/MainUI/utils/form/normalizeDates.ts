export function normalizeDates(obj: unknown): unknown {
  if (typeof obj === "string") {
    const isoToNormalize = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+(Z|[+-]\d{2}:\d{2})$/;
    if (isoToNormalize.test(obj)) {
      const date = new Date(obj);
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(normalizeDates);
  }

  if (typeof obj === "object" && obj !== null) {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = normalizeDates((obj as Record<string, unknown>)[key]);
      }
    }
    return newObj;
  }

  return obj;
}

export function transformDates(obj: unknown): unknown {
  if (typeof obj === "string") {
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    return dateRegex.test(obj) ? obj.replace(dateRegex, "$3-$2-$1") : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformDates);
  }

  if (obj && typeof obj === "object") {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, transformDates(value)]));
  }

  return obj;
}
