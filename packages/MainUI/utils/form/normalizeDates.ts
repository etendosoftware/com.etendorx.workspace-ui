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
