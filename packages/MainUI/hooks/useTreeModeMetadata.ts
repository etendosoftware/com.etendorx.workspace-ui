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

// Cache para evitar múltiples consultas a la misma información
const treeMetadataCache = new Map<string, TreeMetadata>();

/**
 * Hook para consultar la metadata de AD_Tree y determinar si un tab soporta tree mode
 * Busca en la configuración de tree and node image para obtener la información necesaria
 */
export function useTreeModeMetadata(tab: Tab) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [treeMetadata, setTreeMetadata] = useState<TreeMetadata>({ supportsTreeMode: false });

  console.log("ESTE ES EL TAB", tab);
  console.log("ESTE ES EL WINDOW", window);

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
      console.log("🌲 Fetching tree metadata for:", {
        tab: tab.name,
        tabId: tab.id,
        windowId: tab.window,
        entityName: tab.entityName,
        table: tab.table,
        uiPattern: tab.uIPattern,
        tabLevel: tab.tabLevel,
        allTabProperties: Object.keys(tab),
      });

      // Método 1: Intentar obtener la metadata completa del tab para buscar configuración de tree
      let treeMetadata: TreeMetadata = { supportsTreeMode: false };

      try {
        // Primero, intentemos obtener metadata adicional del tab
        const fullTabData = await Metadata.getTab(tab.id);
        console.log("📊 Full tab metadata:", {
          tabName: fullTabData?.name,
          properties: Object.keys(fullTabData || {}),
          hasTreeConfig: fullTabData && "treeId" in fullTabData,
        });

        // Si el tab tiene configuración específica de tree, usarla
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

          console.log("✅ Found tree configuration in tab metadata:", {
            tabName: tab.name,
            adTreeId,
            treeMetadata,
          });
        }
      } catch (metadataError) {
        console.log("⚠️ Could not fetch extended tab metadata:", metadataError);
      }

      // Método 2: Si no encontramos configuración específica, usar lógica basada en entidad
      if (!treeMetadata.supportsTreeMode) {
        treeMetadata = getTreeMetadataByEntity(tab.entityName, tab.table, tab.id, tab);
      }

      // Método 3: Fallback - consultar si existe un AD_Tree asociado a esta tabla
      if (!treeMetadata.supportsTreeMode) {
        treeMetadata = await queryTreeByTableName(tab.table, tab.entityName);
      }

      console.log(treeMetadata.supportsTreeMode ? "✅" : "❌", "Tree mode result:", {
        tabName: tab.name,
        entityName: tab.entityName,
        supportsTreeMode: treeMetadata.supportsTreeMode,
        treeEntity: treeMetadata.treeEntity,
      });

      // Cachear el resultado
      treeMetadataCache.set(cacheKey, treeMetadata);
      setTreeMetadata(treeMetadata);
    } catch (e) {
      logger.warn("Failed to fetch tree metadata:", e);

      // Como fallback final, usar detección automática de metadata
      const fallbackEntityId = getEntityIdFromTab(tab.entityName, tab.id);
      const supportsTreeMode = detectTreeSupportFromMetadata(tab, undefined);
      const fallbackMetadata: TreeMetadata = {
        supportsTreeMode,
        treeEntity: fallbackEntityId,
        referencedTableId: getTableIdFromTableName(tab.table),
      };

      console.log("🔄 Using fallback tree metadata for:", {
        tabName: tab.name,
        entityName: tab.entityName,
        fallbackMetadata,
      });

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

// Helper functions for tree metadata detection

/**
 * Obtiene metadata de tree basada en el nombre de entidad y tabla
 * Usa una lista conocida de entidades que soportan tree view
 */
function getTreeMetadataByEntity(entityName: string, tableName: string, tabId?: string, fullTab?: Tab): TreeMetadata {
  console.log("🔍 Checking entity-based tree metadata:", { entityName, tableName, tabId });

  // Para OKR y otros módulos, usar el entity ID derivado del tabId o entityName
  const entityId = getEntityIdFromTab(entityName, tabId);

  // Usar la nueva función de detección automática basada en patrones
  const supportsTreeMode = detectTreeSupportByPatterns(entityName, tableName, fullTab);

  if (!supportsTreeMode) {
    console.log("❌ No tree support detected for:", { entityName, tableName });
    return { supportsTreeMode: false };
  }

  // Si soporta tree mode, generar configuración dinámica
  const treeConfig = {
    supportsTreeMode: true,
    treeEntity: entityId,
    referencedTableId: getTableIdFromTableName(tableName),
  };

  console.log("✅ Generated dynamic tree config:", { entityName, tableName, treeConfig });
  return treeConfig;
}

/**
 * Consulta AD_Tree por nombre de tabla para detectar configuración automática
 */
async function queryTreeByTableName(tableName: string, entityName: string): Promise<TreeMetadata> {
  console.log("🌐 Querying AD_Tree for table:", { tableName, entityName });

  try {
    // Esta sería la implementación real para consultar AD_Tree
    // Por ahora, simulamos la consulta con lógica conocida

    // Ejemplo de consulta que se haría:
    // SELECT ad_tree_id, name, treetype
    // FROM ad_tree
    // WHERE table_id = (SELECT ad_table_id FROM ad_table WHERE tablename = tableName)

    const tableId = getTableIdFromTableName(tableName);
    if (!tableId) {
      console.log("❌ Table ID not found for:", tableName);
      return { supportsTreeMode: false };
    }

    // Simular respuesta de AD_Tree (en implementación real sería una llamada a API)
    const mockTreeResponse = await simulateTreeQuery(tableName, tableId);

    if (mockTreeResponse.found) {
      const entityId = getEntityIdFromTab(entityName, undefined);
      console.log("✅ Found tree configuration via AD_Tree query:", mockTreeResponse);
      return {
        supportsTreeMode: true,
        treeEntity: entityId, // Usar entity ID basado en entityName
        referencedTableId: tableId,
        adTreeId: mockTreeResponse.adTreeId,
      };
    }

    console.log("❌ No AD_Tree configuration found for table:", tableName);
    return { supportsTreeMode: false };
  } catch (error) {
    console.error("❌ Error querying AD_Tree:", error);
    return { supportsTreeMode: false };
  }
}

/**
 * Simula la consulta a AD_Tree (en implementación real sería una llamada HTTP)
 */
async function simulateTreeQuery(
  tableName: string,
  _tableId: string
): Promise<{ found: boolean; adTreeId?: string; treetype?: string }> {
  // Simular delay de red
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Mapeo de tablas conocidas que tienen trees
  const knownTreeTables: Record<string, { adTreeId: string; treetype: string }> = {
    ad_menu: { adTreeId: "10", treetype: "MM" },
    ad_org: { adTreeId: "104", treetype: "OO" },
    // Agregar más tablas según se necesiten
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

  // Para OKR y otros módulos, asumir que pueden tener tree si contienen ciertos patrones
  if (normalizedTableName.includes("okr")) {
    return {
      found: true,
      adTreeId: "OKR_TREE", // ID específico para OKR
      treetype: "XX",
    };
  }

  return { found: false };
}

/**
 * Detecta automáticamente si una entidad soporta tree mode basado en análisis de metadata
 */
function detectTreeSupportFromMetadata(tab: Tab, fullTabData?: Tab): boolean {
  console.log("🔍 Auto-detecting tree support for:", {
    entityName: tab.entityName,
    tableName: tab.table,
    hasParentColumns: tab.parentColumns?.length > 0,
    tabProperties: Object.keys(fullTabData || tab),
  });

  // Verificar si hay campos que sugieren estructura jerárquica
  const hasHierarchicalFields = checkForHierarchicalFields(tab);
  if (hasHierarchicalFields) {
    console.log("✅ Found hierarchical fields in tab:", hasHierarchicalFields);
    return true;
  }

  // Verificar patrones conocidos en nombres de tablas/entidades
  const hasKnownPatterns = checkForTreePatterns(tab.entityName, tab.table);
  if (hasKnownPatterns) {
    console.log("✅ Found known tree patterns:", hasKnownPatterns);
    return true;
  }

  // Verificar si la metadata extendida tiene configuración de tree
  if (fullTabData && hasTreeConfiguration(fullTabData)) {
    console.log("✅ Found tree configuration in extended metadata");
    return true;
  }

  console.log("❌ No tree support detected through metadata analysis");
  return false;
}

/**
 * Versión simplificada para detectar tree support basado solo en patrones
 */
function detectTreeSupportByPatterns(entityName: string, tableName: string, fullTab?: Tab): boolean {
  console.log("🔍 Detecting tree support by patterns:", { entityName, tableName });

  // Verificar patrones conocidos en nombres de tablas/entidades
  const hasKnownPatterns = checkForTreePatterns(entityName, tableName);
  if (hasKnownPatterns) {
    console.log("✅ Found known tree patterns:", hasKnownPatterns);
    return true;
  }

  // Si tenemos el tab completo, verificar campos jerárquicos
  if (fullTab) {
    const hasHierarchicalFields = checkForHierarchicalFields(fullTab);
    if (hasHierarchicalFields) {
      console.log("✅ Found hierarchical fields:", hasHierarchicalFields);
      return true;
    }

    // Verificar configuración de tree en metadata
    if (hasTreeConfiguration(fullTab)) {
      console.log("✅ Found tree configuration in metadata");
      return true;
    }
  }

  console.log("❌ No tree support detected by patterns");
  return false;
}

/**
 * Verifica si un tab tiene campos que sugieren estructura jerárquica
 */
function checkForHierarchicalFields(tab: Tab): string | null {
  const fields = Object.values(tab.fields || {});

  // Buscar campos comunes de jerarquía
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

/**
 * Verifica patrones conocidos que sugieren tree mode
 */
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

/**
 * Verifica si la metadata extendida contiene configuración de tree
 */
function hasTreeConfiguration(tabData: Tab): boolean {
  // Verificar propiedades específicas de tree en la metadata
  const treeProps = ["treeId", "adTreeId", "tree_id", "ad_tree_id"];

  for (const prop of treeProps) {
    if (prop in tabData && (tabData as unknown as Record<string, unknown>)[prop]) {
      return true;
    }
  }

  return false;
}

/**
 * Obtiene el ID de tabla basado en el nombre de la tabla
 * En implementación real consultaría AD_Table
 */
function getTableIdFromTableName(tableName: string): string {
  // Mapeo de nombres de tabla a IDs conocidos
  const tableIds: Record<string, string> = {
    ad_menu: "155",
    ad_org: "155", // Usar mismo ID por simplicidad, en real sería diferente
    c_bpartner: "291",
    ad_table: "100",
    ad_column: "101",
    // Agregar más mapeos según se necesiten
  };

  const normalizedTableName = tableName.toLowerCase();
  const tableId = tableIds[normalizedTableName];

  if (tableId) {
    console.log("📋 Found table ID:", { tableName, tableId });
    return tableId;
  }

  // Para tablas desconocidas, generar un ID basado en hash o usar uno genérico
  console.log("⚠️ Table ID not found, using generic ID for:", tableName);
  return "155"; // ID genérico como fallback
}

/**
 * Genera o deriva un entity ID basado en el entityName y tabId
 * En una implementación real, esto se obtendría de la metadata del tab
 */
function getEntityIdFromTab(entityName: string, tabId?: string): string {
  console.log("🆔 Getting entity ID for:", { entityName, tabId });

  // Mapeo conocido de tabIds a entityIds (esto debería venir de metadata real)
  const knownTabMappings: Record<string, string> = {
    "4CCBC0DBDA324A5E8AF930AC612C52A6": "610BEAE5E223447DBE6FF672B703F72F", // OKR tab conocido
    // Se pueden agregar más mapeos según se descubran
  };

  // Si tenemos un mapeo directo por tabId, usarlo
  if (tabId && knownTabMappings[tabId]) {
    const entityId = knownTabMappings[tabId];
    console.log("✅ Found direct tab mapping:", { tabId, entityId });
    return entityId;
  }

  // Fallback: usar patrones conocidos basados en entityName
  if (entityName.toLowerCase().includes("okr")) {
    console.log("🎯 Using OKR pattern fallback for:", entityName);
    return "610BEAE5E223447DBE6FF672B703F72F";
  }

  if (entityName === "Menu" || entityName === "ADMenu" || entityName.toLowerCase().includes("menu")) {
    console.log("📋 Using Menu pattern fallback for:", entityName);
    return "90034CAE96E847D78FBEF6D38CB1930D";
  }

  // Para entidades desconocidas, usar menú como fallback seguro
  console.log("⚡ Using menu fallback for unknown entity:", entityName);
  return "90034CAE96E847D78FBEF6D38CB1930D";
}
