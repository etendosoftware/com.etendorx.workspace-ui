/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { TreeFilterParams } from "@workspaceui/api-client/src/hooks/useColumnFilterData";
import type { FilterOption } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";

/**
 * Pure helpers of the Product Characteristics column filter. They reproduce the rules of the Classic
 * filter (`ob-formitem-characteristics.js`): cascading selection of groups, the text shown in the
 * filter cell and the HQL `exists` query that limits the products.
 */

/** Datasource that builds the tree of characteristics and values (Classic `ProductCharacteristicsDS`). */
export const CHARACTERISTICS_TREE_DATASOURCE_ID = "BE2735798ECC4EF88D131F16F1C4EC72";

/** Placeholder of the product property in the exists query, as in Classic. */
const PRODUCT_IN_ENTITY = "{productInEntity}";

/** HQL exists query of the Classic filter; `$value` receives the ids of the selected values. */
export const CHARACTERISTICS_EXISTS_QUERY = `exists (from ProductCharacteristicValue v where ${PRODUCT_IN_ENTITY} = v.product and v.characteristicValue.id in ($value))`;

/** Alias of the base entity in datasource queries. */
const BASE_ENTITY_ALIAS = "e";
const PRODUCT_ENTITY_NAME = "Product";
const PRODUCT_PROPERTY = "product";
/** Separator of the segments of a property path in a field name (e.g. `product$characteristicDescription`). */
const FIELD_PATH_SEPARATOR = "$";
const HQL_PATH_SEPARATOR = ".";
/** Flag that marks the criteria of this filter, as in Classic. */
const CHARACTERISTICS_CRITERIA_FLAG = "isProductCharacteristicsCriteria";

export type CheckState = "checked" | "indeterminate" | "unchecked";

/**
 * Grid the characteristics filter belongs to. It decides which values the tree offers, as Classic
 * does: the values of the records of the grid (standard windows) or of the process (Pick and Execute).
 */
export interface CharacteristicsFilterContext {
  /** Entity of the grid rows. */
  entityName?: string;
  /** Alias of the grid entity in its query (Pick and Execute grids always have one, `e` by default). */
  alias?: string;
  /** Datasource of the grid, sent so the tree only offers values of the grid records. */
  parentDatasourceId?: string;
  /** Process of a Pick and Execute grid, for the custom restrictions of some processes. */
  processId?: string;
  /** Context of the record that launched the process, serialized as JSON. */
  buttonOwnerContextInfo?: string;
  /** Returns the current criteria of the grid. */
  getCriteria?: () => unknown;
}

/** Minimal shape of a tree node of the filter. */
export interface CharacteristicsTreeNode {
  id: string;
  label: string;
  parentId?: string | null;
  isCharacteristic?: boolean;
  characteristic?: string;
  characteristicName?: string;
}

/**
 * Returns the base of the product path: the base entity, or the grid alias plus `.product` when the
 * grid entity is not a product (Classic `OBCharacteristicsFilterItem.init`).
 */
const resolveProductBase = (fieldName: string, entityName?: string, alias?: string): string => {
  if (!alias) return BASE_ENTITY_ALIAS;
  if (entityName === PRODUCT_ENTITY_NAME || fieldName.startsWith(`${PRODUCT_PROPERTY}${FIELD_PATH_SEPARATOR}`)) {
    return alias;
  }
  return `${alias}${HQL_PATH_SEPARATOR}${PRODUCT_PROPERTY}`;
};

/**
 * Returns the HQL path of the product a grid row refers to. For `characteristicDescription` it is the
 * base entity (`e`); for `product$characteristicDescription` it is `e.product`.
 */
export function resolveProductPath(fieldName: string, entityName?: string, alias?: string): string {
  const segments = fieldName.split(FIELD_PATH_SEPARATOR).slice(0, -1);
  return [resolveProductBase(fieldName, entityName, alias), ...segments].join(HQL_PATH_SEPARATOR);
}

/** Returns the exists query of the filter for the given product path. */
export function buildCharacteristicsExistsQuery(productPath: string): string {
  return CHARACTERISTICS_EXISTS_QUERY.replace(PRODUCT_IN_ENTITY, productPath);
}

/**
 * Grid of the characteristics filter of a standard window: the tree offers the values of the records
 * the grid shows with its other filters, as Classic does. Other references have no context.
 */
export function buildGridCharacteristicsContext(
  reference: string | undefined,
  entityName: string,
  getRequestParams: () => { criteria?: unknown }
): CharacteristicsFilterContext | undefined {
  if (reference !== FIELD_REFERENCE_CODES.PRODUCT_CHARACTERISTICS.id) return undefined;
  return {
    entityName,
    parentDatasourceId: entityName,
    getCriteria: () => getRequestParams().criteria,
  };
}

/** Options of an applied column filter, whose value is the list of the selected options. */
export function toAppliedFilterOptions(value: unknown): FilterOption[] {
  return Array.isArray(value) ? (value as FilterOption[]) : [];
}

/**
 * Grid of the characteristics filter in a Pick and Execute process. As in Classic, the tree is not
 * limited by the grid records but by the process (e.g. Manage Variants offers the values of the
 * product that launched it), and the grid query alias is the base entity.
 */
export function buildProcessCharacteristicsContext(
  entityName: string | undefined,
  processId: string | undefined,
  recordValues: Record<string, unknown> | undefined
): CharacteristicsFilterContext {
  return {
    entityName,
    alias: BASE_ENTITY_ALIAS,
    processId,
    buttonOwnerContextInfo: JSON.stringify(recordValues ?? {}),
  };
}

/**
 * Builds the parameters of the characteristics tree request for a grid, as Classic
 * `OBCharacteristicsFilterDialog` does: the grid criteria without the characteristics criteria.
 */
export function buildCharacteristicsTreeParams(
  context: CharacteristicsFilterContext,
  productPath: string
): TreeFilterParams {
  return {
    _parentDSIdentifier: context.parentDatasourceId,
    _propertyPath: productPath,
    _processId: context.processId,
    _buttonOwnerContextInfo: context.buttonOwnerContextInfo,
    criteria: stripCharacteristicsCriteria(context.getCriteria?.()),
  };
}

/** Builds a map from each node id to the ids of its children, keeping the order of the nodes. */
export function buildChildrenMap(nodes: CharacteristicsTreeNode[]): Map<string, string[]> {
  const childrenMap = new Map<string, string[]>();
  for (const node of nodes) {
    if (!node.parentId) continue;
    const children = childrenMap.get(node.parentId) ?? [];
    children.push(node.id);
    childrenMap.set(node.parentId, children);
  }
  return childrenMap;
}

/**
 * Builds a map from each node id to the ids of the leaves below it (a leaf maps to itself). Only
 * leaves filter, as in Classic; groups and characteristics select all their leaves.
 */
export function buildLeafIdsIndex(
  nodes: CharacteristicsTreeNode[],
  childrenMap: Map<string, string[]>
): Map<string, string[]> {
  const index = new Map<string, string[]>();
  const collect = (nodeId: string, visiting: Set<string>): string[] => {
    const known = index.get(nodeId);
    if (known) return known;
    const children = childrenMap.get(nodeId);
    if (!children || visiting.has(nodeId)) {
      index.set(nodeId, [nodeId]);
      return [nodeId];
    }
    visiting.add(nodeId);
    const leaves = children.flatMap((childId) => collect(childId, visiting));
    index.set(nodeId, leaves);
    return leaves;
  };
  for (const node of nodes) collect(node.id, new Set());
  return index;
}

/** Returns whether all, some or none of the given leaves are selected. */
export function getCheckState(leafIds: string[], selected: Set<string>): CheckState {
  const selectedCount = leafIds.filter((id) => selected.has(id)).length;
  if (selectedCount === 0) return "unchecked";
  if (selectedCount === leafIds.length) return "checked";
  return "indeterminate";
}

/**
 * Toggles a node: when all its leaves are selected they are unselected, otherwise the missing ones are
 * selected (Classic cascading selection).
 */
export function toggleLeafSelection(selectedIds: string[], leafIds: string[]): string[] {
  const selected = new Set(selectedIds);
  if (getCheckState(leafIds, selected) === "checked") {
    const toRemove = new Set(leafIds);
    return selectedIds.filter((id) => !toRemove.has(id));
  }
  return [...selectedIds, ...leafIds.filter((id) => !selected.has(id))];
}

interface LabelGroup {
  name: string;
  values: string[];
}

/** Context shared by the steps that build the label of the filter cell. */
interface LabelContext {
  selected: Set<string>;
  childrenMap: Map<string, string[]>;
  leafIndex: Map<string, string[]>;
  completeGroups: Set<string>;
}

const hasChildGroups = (nodeId: string, childrenMap: Map<string, string[]>): boolean =>
  (childrenMap.get(nodeId) ?? []).some((childId) => childrenMap.has(childId));

/**
 * Returns the text that represents a node in the label, or null when it is not shown. A fully selected
 * group without inner groups is shown by its name instead of its values (Classic
 * `OBCharacteristicsFilterDialog.getValue`).
 */
const getVisibleLabel = (node: CharacteristicsTreeNode, context: LabelContext): string | null => {
  const { selected, childrenMap, leafIndex, completeGroups } = context;
  if (!childrenMap.has(node.id)) {
    if (!selected.has(node.id)) return null;
    if (node.parentId && completeGroups.has(node.parentId)) return null;
    return node.label;
  }
  const state = getCheckState(leafIndex.get(node.id) ?? [], selected);
  if (state !== "checked" || hasChildGroups(node.id, childrenMap)) return null;
  completeGroups.add(node.id);
  return node.label;
};

const formatLabelGroups = (groups: Map<string, LabelGroup>): string =>
  [...groups.values()]
    .filter((group) => group.values.length > 0)
    .map((group) => `${group.name}:[${group.values.join(" - ")}]`)
    .join(", ");

/**
 * Builds the text of the filter cell as Classic does (`OBCharacteristicsFilterItem.getDisplayValue`):
 * `Characteristic:[value - value], Other:[group]`. The nodes must be in tree order (parents before
 * their children). Passing only the selected leaves (e.g. a restored filter) lists each leaf.
 */
export function buildCharacteristicsLabel(nodes: CharacteristicsTreeNode[], selectedIds: string[]): string {
  const childrenMap = buildChildrenMap(nodes);
  const context: LabelContext = {
    selected: new Set(selectedIds),
    childrenMap,
    leafIndex: buildLeafIdsIndex(nodes, childrenMap),
    completeGroups: new Set(),
  };
  const groups = new Map<string, LabelGroup>();
  for (const node of nodes) {
    if (node.isCharacteristic) continue;
    const label = getVisibleLabel(node, context);
    if (label === null) continue;
    const key = node.characteristic ?? "";
    const group = groups.get(key) ?? { name: node.characteristicName ?? "", values: [] };
    group.values.push(label);
    groups.set(key, group);
  }
  return formatLabelGroups(groups);
}

/** Parses a criteria string, returning null when it is not valid JSON. */
const parseCriteria = (criteria: string): unknown => {
  try {
    return JSON.parse(criteria);
  } catch {
    return null;
  }
};

/** Normalizes the `criteria` of a datasource request (an object, a list or JSON strings) to a list. */
const toCriteriaList = (criteria: unknown): object[] => {
  if (criteria === undefined || criteria === null) return [];
  const items = Array.isArray(criteria) ? criteria : [criteria];
  return items
    .map((item) => (typeof item === "string" ? parseCriteria(item) : item))
    .filter((item): item is object => typeof item === "object" && item !== null);
};

/**
 * Returns the criteria of a grid without the criteria of the characteristics filter, which is what
 * Classic sends to the characteristics tree so it offers only the values of the records the grid can
 * show with the other filters (`removeProductCharacteristicsCriteria`).
 */
export function stripCharacteristicsCriteria(criteria: unknown): object[] {
  return toCriteriaList(criteria).filter((item) => !(item as Record<string, unknown>)[CHARACTERISTICS_CRITERIA_FLAG]);
}
