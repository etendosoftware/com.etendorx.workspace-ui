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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { logger } from "@/utils/logger";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { Tab } from "@workspaceui/api-client/src/api/types";

interface TreeMetadata {
  supportsTreeMode: boolean;
  treeEntity?: string;
  referencedTableId?: string;
  adTreeId?: string;
  nodeImageTabId?: string;
}

const treeMetadataCache = new Map<string, TreeMetadata>();

export function useTreeModeMetadata(tab: Tab) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [treeMetadata, setTreeMetadata] = useState<TreeMetadata>({ supportsTreeMode: false });

  const cacheKey = useMemo(() => `${tab.window}-${tab.id}`, [tab.window, tab.id]);

  const fetchTreeMetadata = useCallback(async () => {
    if (treeMetadataCache.has(cacheKey)) {
      const cachedData = treeMetadataCache.get(cacheKey);
      if (cachedData) {
        setTreeMetadata(cachedData);
        return;
      }
    }

    setLoading(true);
    setError(undefined);

    try {
      let treeMetadata: TreeMetadata = { supportsTreeMode: false };

      try {
        const fullTabData = await Metadata.getTab(tab.id);

        if (fullTabData && ("treeId" in fullTabData || "adTreeId" in fullTabData)) {
          const adTreeId =
            (fullTabData as Record<string, unknown>).treeId || (fullTabData as Record<string, unknown>).adTreeId;
          const entityId = getEntityIdFromTab(tab.entityName, tab.id);
          treeMetadata = {
            supportsTreeMode: true,
            treeEntity: entityId,
            adTreeId: String(adTreeId),
            referencedTableId: getTableIdFromTableName(tab.table),
          };
        }
      } catch (metadataError) {
        console.log("⚠️ Could not fetch extended tab metadata:", metadataError);
      }

      if (!treeMetadata.supportsTreeMode) {
        treeMetadata = getTreeMetadataByEntity(tab.entityName, tab.table, tab.id, tab);
      }

      if (!treeMetadata.supportsTreeMode) {
        treeMetadata = await queryTreeByTableName(tab.table, tab.entityName);
      }

      treeMetadataCache.set(cacheKey, treeMetadata);
      setTreeMetadata(treeMetadata);
    } catch (e) {
      logger.warn("Failed to fetch tree metadata:", e);

      const fallbackEntityId = getEntityIdFromTab(tab.entityName, tab.id);
      const supportsTreeMode = detectTreeSupportFromMetadata(tab);
      const fallbackMetadata: TreeMetadata = {
        supportsTreeMode,
        treeEntity: fallbackEntityId,
        referencedTableId: getTableIdFromTableName(tab.table),
      };

      treeMetadataCache.set(cacheKey, fallbackMetadata);
      setTreeMetadata(fallbackMetadata);
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [tab, cacheKey]);

  useEffect(() => {
    fetchTreeMetadata();
  }, [fetchTreeMetadata]);

  return useMemo(
    () => ({
      loading,
      error,
      treeMetadata,
      refetch: fetchTreeMetadata,
    }),
    [loading, error, treeMetadata, fetchTreeMetadata]
  );
}

function getTreeMetadataByEntity(entityName: string, tableName: string, tabId?: string, fullTab?: Tab): TreeMetadata {
  const entityId = getEntityIdFromTab(entityName, tabId);

  const supportsTreeMode = detectTreeSupportByPatterns(entityName, tableName, fullTab);

  if (!supportsTreeMode) {
    return { supportsTreeMode: false };
  }

  const treeConfig = {
    supportsTreeMode: true,
    treeEntity: entityId,
    referencedTableId: getTableIdFromTableName(tableName),
  };

  return treeConfig;
}

async function queryTreeByTableName(tableName: string, entityName: string): Promise<TreeMetadata> {
  try {
    const tableId = getTableIdFromTableName(tableName);
    if (!tableId) {
      return { supportsTreeMode: false };
    }

    const mockTreeResponse = await simulateTreeQuery(tableName, tableId);

    if (mockTreeResponse.found) {
      const entityId = getEntityIdFromTab(entityName);
      return {
        supportsTreeMode: true,
        treeEntity: entityId,
        referencedTableId: tableId,
        adTreeId: mockTreeResponse.adTreeId,
      };
    }

    return { supportsTreeMode: false };
  } catch (error) {
    console.error("❌ Error querying AD_Tree:", error);
    return { supportsTreeMode: false };
  }
}

async function simulateTreeQuery(
  tableName: string,
  _tableId: string
): Promise<{ found: boolean; adTreeId?: string; treetype?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const knownTreeTables: Record<string, { adTreeId: string; treetype: string }> = {
    ad_menu: { adTreeId: "10", treetype: "MM" },
    ad_org: { adTreeId: "104", treetype: "OO" },
  };

  const normalizedTableName = tableName.toLowerCase();
  const treeConfig = knownTreeTables[normalizedTableName];

  if (treeConfig) {
    return {
      found: true,
      adTreeId: treeConfig.adTreeId,
      treetype: treeConfig.treetype,
    };
  }

  if (normalizedTableName.includes("okr")) {
    return {
      found: true,
      adTreeId: "OKR_TREE",
      treetype: "XX",
    };
  }

  return { found: false };
}

function detectTreeSupportFromMetadata(tab: Tab, fullTabData?: Tab): boolean {
  const hasHierarchicalFields = checkForHierarchicalFields(tab);
  if (hasHierarchicalFields) {
    return true;
  }

  const hasKnownPatterns = checkForTreePatterns(tab.entityName, tab.table);
  if (hasKnownPatterns) {
    return true;
  }

  if (fullTabData && hasTreeConfiguration(fullTabData)) {
    return true;
  }
  return false;
}

function detectTreeSupportByPatterns(entityName: string, tableName: string, fullTab?: Tab): boolean {
  const hasKnownPatterns = checkForTreePatterns(entityName, tableName);
  if (hasKnownPatterns) {
    return true;
  }

  if (fullTab) {
    const hasHierarchicalFields = checkForHierarchicalFields(fullTab);
    if (hasHierarchicalFields) {
      return true;
    }

    if (hasTreeConfiguration(fullTab)) {
      return true;
    }
  }

  return false;
}

function checkForHierarchicalFields(tab: Tab): string | null {
  const fields = Object.values(tab.fields || {});

  const hierarchicalFieldNames = [
    "parentid",
    "parent_id",
    "parent",
    "seqno",
    "seq_no",
    "sequence",
    "islevelparent",
    "is_summary",
    "hassummary",
    "treeid",
    "tree_id",
    "adtreeid",
    "ad_tree_id",
  ];

  for (const field of fields) {
    const fieldName = field.columnName?.toLowerCase() || field.name?.toLowerCase() || "";
    for (const hierarchicalField of hierarchicalFieldNames) {
      if (fieldName.includes(hierarchicalField)) {
        return `Found hierarchical field: ${field.columnName || field.name}`;
      }
    }
  }

  return null;
}

function checkForTreePatterns(entityName: string, tableName: string): string | null {
  const treePatterns = [
    { pattern: "menu", description: "Menu hierarchy" },
    { pattern: "org", description: "Organization hierarchy" },
    { pattern: "okr", description: "OKR hierarchy" },
    { pattern: "tree", description: "Explicit tree structure" },
    { pattern: "node", description: "Node-based structure" },
    { pattern: "category", description: "Category hierarchy" },
    { pattern: "folder", description: "Folder structure" },
  ];

  const entityLower = entityName.toLowerCase();
  const tableLower = tableName.toLowerCase();

  for (const { pattern, description } of treePatterns) {
    if (entityLower.includes(pattern) || tableLower.includes(pattern)) {
      return description;
    }
  }

  return null;
}

function hasTreeConfiguration(tabData: Tab): boolean {
  const treeProps = ["treeId", "adTreeId", "tree_id", "ad_tree_id"];

  for (const prop of treeProps) {
    if (prop in tabData && (tabData as unknown as Record<string, unknown>)[prop]) {
      return true;
    }
  }

  return false;
}

function getTableIdFromTableName(tableName: string): string {
  const tableIds: Record<string, string> = {
    ad_menu: "155",
    ad_org: "155",
    c_bpartner: "291",
    ad_table: "100",
    ad_column: "101",
  };

  const normalizedTableName = tableName.toLowerCase();
  const tableId = tableIds[normalizedTableName];

  if (tableId) {
    return tableId;
  }

  return "155";
}

function getEntityIdFromTab(entityName: string, tabId?: string): string {
  const knownTabMappings: Record<string, string> = {
    "4CCBC0DBDA324A5E8AF930AC612C52A6": "610BEAE5E223447DBE6FF672B703F72F",
  };

  if (tabId && knownTabMappings[tabId]) {
    const entityId = knownTabMappings[tabId];
    return entityId;
  }

  if (entityName.toLowerCase().includes("okr")) {
    return "610BEAE5E223447DBE6FF672B703F72F";
  }

  if (entityName === "Menu" || entityName === "ADMenu" || entityName.toLowerCase().includes("menu")) {
    return "90034CAE96E847D78FBEF6D38CB1930D";
  }

  console.log("⚡ Using menu fallback for unknown entity:", entityName);
  return "90034CAE96E847D78FBEF6D38CB1930D";
}
