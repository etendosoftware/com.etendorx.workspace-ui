/** Product characteristics, their values and products that have them, created by a spec through the `api` fixture. */
import type { ApiData, SavedRecord } from "../api/ApiData";
import { ORGANIZATION_ID } from "../registry/data";
import { DATASOURCE, type DatasourceTarget } from "../registry/datasources";
import { TABS } from "../registry/windows";

/** Unit, category and tax category of the sample product "Final good A" (QA_Testing). */
const PRODUCT_DEFAULTS = {
  uOM: "4028E6C72959682B01295ADC1A380221",
  productCategory: "4028E6C72959682B01295ADC1CC80228",
  taxCategory: "4028E6C72959682B01295ADC1CF70229",
  productType: "I",
} as const;

/** AD_Table_ID of `M_Ch_Value`, the records of the characteristic values tree. */
const CHARACTERISTIC_VALUE_TABLE_ID = "E913D17C9B3847CF92235082DBE2EC44";

/** A characteristic value; with `values` it is a group of them. */
export interface CharacteristicValueSpec {
  name: string;
  values?: CharacteristicValueSpec[];
}

export interface CharacteristicSpec {
  name: string;
  values: CharacteristicValueSpec[];
}

/** A product and the names of its characteristic values. */
export interface ProductSpec {
  name: string;
  values: string[];
}

/** Ids of what the spec created, by name, and the records to remove afterwards. */
export interface CharacteristicsDataSet {
  characteristics: Map<string, string>;
  values: Map<string, { id: string; characteristic: string }>;
  products: Map<string, string>;
  created: { target: DatasourceTarget; id: string }[];
}

export function emptyCharacteristicsDataSet(): CharacteristicsDataSet {
  return { characteristics: new Map(), values: new Map(), products: new Map(), created: [] };
}

async function addRecord(
  api: ApiData,
  dataSet: CharacteristicsDataSet,
  target: DatasourceTarget,
  values: Record<string, unknown>
): Promise<SavedRecord> {
  const record = await api.add(target, values);
  dataSet.created.push({ target, id: record.id });
  return record;
}

/** Creates a value and, for a group, its values moved under it in the characteristic tree. */
async function addValue(
  api: ApiData,
  dataSet: CharacteristicsDataSet,
  characteristic: string,
  value: CharacteristicValueSpec,
  parentId?: string
): Promise<void> {
  const record = await addRecord(api, dataSet, DATASOURCE.CHARACTERISTIC_VALUE, {
    organization: ORGANIZATION_ID.ALL,
    characteristic,
    name: value.name,
    // Short and unique in the data set: the code holds 10 characters
    code: `V${dataSet.values.size + 1}`,
    summaryLevel: Boolean(value.values),
  });
  dataSet.values.set(value.name, { id: record.id, characteristic });
  if (parentId) {
    await api.moveTreeNode({
      tabId: TABS.CHARACTERISTIC_VALUE,
      tableId: CHARACTERISTIC_VALUE_TABLE_ID,
      nodeId: record.id,
      parentId,
    });
  }
  for (const child of value.values ?? []) {
    await addValue(api, dataSet, characteristic, child, record.id);
  }
}

/**
 * Creates the characteristics with their values and groups (value names are unique across the data set), in
 * the given order, and fills `dataSet` with what it created.
 */
export async function createCharacteristics(
  api: ApiData,
  dataSet: CharacteristicsDataSet,
  characteristics: CharacteristicSpec[]
): Promise<void> {
  for (const characteristic of characteristics) {
    const record = await addRecord(api, dataSet, DATASOURCE.CHARACTERISTIC, {
      organization: ORGANIZATION_ID.ALL,
      name: characteristic.name,
      variant: false,
    });
    dataSet.characteristics.set(characteristic.name, record.id);
    for (const value of characteristic.values) {
      await addValue(api, dataSet, record.id, value);
    }
  }
}

/** Sequence of the characteristics of a product, in the order its values name them. */
const SEQUENCE_STEP = 10;

/** The characteristics of the given values, in order of appearance and without repetitions. */
function characteristicsOf(dataSet: CharacteristicsDataSet, valueNames: string[]): string[] {
  const characteristics = valueNames.map((valueName) => {
    const value = dataSet.values.get(valueName);
    if (!value) throw new Error(`Unknown characteristic value ${valueName}`);
    return value.characteristic;
  });
  return [...new Set(characteristics)];
}

/**
 * Creates the products (search key = name) with their characteristic values. As in the Product window, each
 * characteristic is added to the product before its values: the server builds the characteristic
 * description from them a few seconds later.
 */
export async function createProductsWithCharacteristics(
  api: ApiData,
  dataSet: CharacteristicsDataSet,
  products: ProductSpec[]
): Promise<void> {
  // Products do not depend on each other: created side by side, each one in order (ETP-6295)
  await Promise.all(products.map((product) => createProductWithCharacteristics(api, dataSet, product)));
}

/** Creates one product, then its characteristics, then its values (the order the Product window follows). */
async function createProductWithCharacteristics(
  api: ApiData,
  dataSet: CharacteristicsDataSet,
  product: ProductSpec
): Promise<void> {
  const record = await addRecord(api, dataSet, DATASOURCE.PRODUCT, {
    organization: ORGANIZATION_ID.ALL,
    searchKey: product.name,
    name: product.name,
    ...PRODUCT_DEFAULTS,
  });
  dataSet.products.set(product.name, record.id);
  const characteristics = characteristicsOf(dataSet, product.values);
  for (const [index, characteristic] of characteristics.entries()) {
    await addRecord(api, dataSet, DATASOURCE.PRODUCT_CHARACTERISTIC, {
      organization: ORGANIZATION_ID.ALL,
      product: record.id,
      characteristic,
      sequenceNumber: (index + 1) * SEQUENCE_STEP,
      variant: false,
    });
  }
  for (const valueName of product.values) {
    const value = dataSet.values.get(valueName) as { id: string; characteristic: string };
    await addRecord(api, dataSet, DATASOURCE.PRODUCT_CHARACTERISTIC_VALUE, {
      organization: ORGANIZATION_ID.ALL,
      product: record.id,
      characteristic: value.characteristic,
      characteristicValue: value.id,
    });
  }
}

/**
 * The characteristic description of a product as stored, which the server builds a few seconds after its
 * characteristics change: `""` until then.
 */
export async function characteristicDescriptionOf(api: ApiData, productId: string): Promise<string> {
  const [product] = await api.fetch(DATASOURCE.PRODUCT, {
    criteria: [{ fieldName: "id", operator: "equals", value: productId }],
  });
  return String(product?.characteristicDescription ?? "");
}

/** Records of these targets never depend on one another: consecutive ones are removed side by side. */
const INDEPENDENT_TARGETS: ReadonlySet<DatasourceTarget> = new Set([
  DATASOURCE.PRODUCT_CHARACTERISTIC_VALUE,
  DATASOURCE.PRODUCT_CHARACTERISTIC,
  DATASOURCE.PRODUCT,
]);

/**
 * Groups records to remove, in the given order, into batches removed one after another: consecutive records
 * of an independent target go together, any other record alone (a characteristic value may be the parent of
 * the next one in the tree).
 */
export function removalBatches<T extends { target: DatasourceTarget }>(records: T[]): T[][] {
  const batches: T[][] = [];
  for (const record of records) {
    const last = batches.at(-1);
    if (last && INDEPENDENT_TARGETS.has(record.target) && last[0].target === record.target) {
      last.push(record);
    } else {
      batches.push([record]);
    }
  }
  return batches;
}

/**
 * Removes what the data set created, the last created first (values and characteristics of products, products,
 * values, characteristics): each record goes after everything created after it, the records it depends on.
 */
export async function removeCharacteristicsDataSet(api: ApiData, dataSet: CharacteristicsDataSet): Promise<void> {
  for (const batch of removalBatches([...dataSet.created].reverse())) {
    await Promise.all(batch.map((record) => api.remove(record.target, record.id)));
  }
  dataSet.created = [];
}
