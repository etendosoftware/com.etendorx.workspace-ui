/** Records the regression probes create for themselves through the `api` fixture. */
import type { ApiData, SavedRecord } from "../api/ApiData";
import { DATASOURCE } from "../registry/datasources";
import { ORGANIZATION_ID } from "../registry/data";

/**
 * Creates `count` business partner categories named `<prefix>-1`, `<prefix>-2`, … (organization
 * Spain), so a spec can filter a grid by `prefix` and see only its own rows, in name order.
 */
export async function createCategories(api: ApiData, prefix: string, count: number): Promise<SavedRecord[]> {
  const records: SavedRecord[] = [];
  for (let index = 1; index <= count; index++) {
    const key = `${prefix}-${index}`;
    records.push(
      await api.add(DATASOURCE.BUSINESS_PARTNER_CATEGORY, {
        organization: ORGANIZATION_ID.SPAIN,
        searchKey: key,
        name: key,
      })
    );
  }
  return records;
}
