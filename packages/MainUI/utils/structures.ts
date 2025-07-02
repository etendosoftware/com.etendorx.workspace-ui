import type { EntityData } from "@workspaceui/api-client/src/api/types";

export const mapBy = <T = EntityData>(records: T[], key: keyof T) => {
  return records.reduce(
    (acum, current) => {
      acum[current[key] as string] = current;

      return acum;
    },
    {} as Record<string, T>
  );
};
