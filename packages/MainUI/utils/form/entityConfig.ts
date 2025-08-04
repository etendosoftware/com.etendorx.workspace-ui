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

import type { FormMode } from "@workspaceui/api-client/src/api/types";

export interface EntityConfig {
  /** The entity name as it appears in tab.entityName */
  entityName: string;
  /** Remove ID fields when creating new records */
  removeIdOnCreate?: boolean;
  /** Remove ID fields when editing existing records */
  removeIdOnEdit?: boolean;
  /** Custom behaviors for different form modes */
  customBehaviors?: {
    [key in FormMode]?: {
      /** Fields to remove from the payload */
      removeFields?: string[];
      /** Fields to add to the payload */
      addFields?: Record<string, unknown>;
    };
  };
}

/**
 * Configuration for entities that require special handling during form operations
 *
 * @example
 * // To add a new entity configuration:
 * {
 *   entityName: 'YourEntity',
 *   removeIdOnCreate: true,
 *   customBehaviors: {
 *     NEW: {
 *       removeFields: ['someField'],
 *       addFields: { defaultField: 'defaultValue' }
 *     }
 *   }
 * }
 */
export const ENTITY_CONFIGURATIONS: EntityConfig[] = [
  {
    entityName: "UOM",
    removeIdOnCreate: true,
  },
  {
    entityName: "ADUser",
    customBehaviors: {
      EDIT: {
        addFields: {
          inppassword: "***",
          _gridVisibleProperties: [
            "id",
            "name",
            "username",
            "firstName",
            "lastName",
            "password",
            "description",
            "active",
            "businessPartner",
            "partnerAddress",
            "email",
            "locked",
            "position",
            "birthday",
            "phone",
            "alternativePhone",
            "fax",
            "emailServerUsername",
            "emailServerPassword",
            "supervisor",
            "defaultRole",
            "smfswsDefaultWsRole",
            "defaultLanguage",
            "defaultClient",
            "defaultOrganization",
            "defaultWarehouse",
            "etasEnableMultSession",
          ],
        },
      },
    },
  },
  // Add more entity configurations here as needed
];

/**
 * Get configuration for a specific entity
 */
export const getEntityConfig = (entityName: string): EntityConfig | undefined => {
  return ENTITY_CONFIGURATIONS.find((config) => config.entityName === entityName);
};

/**
 * Check if an entity should have ID fields removed for a specific mode
 */
export const shouldRemoveIdFields = (entityName: string, mode: FormMode): boolean => {
  const config = getEntityConfig(entityName);
  if (!config) return false;

  return (mode === "NEW" && Boolean(config.removeIdOnCreate)) || (mode === "EDIT" && Boolean(config.removeIdOnEdit));
};

/**
 * Get custom fields to remove for a specific entity and mode
 */
export const getFieldsToRemove = (entityName: string, mode: FormMode): string[] => {
  const config = getEntityConfig(entityName);
  return config?.customBehaviors?.[mode]?.removeFields || [];
};

/**
 * Get custom fields to add for a specific entity and mode
 */
export const getFieldsToAdd = (entityName: string, mode: FormMode): Record<string, unknown> => {
  const config = getEntityConfig(entityName);
  return config?.customBehaviors?.[mode]?.addFields || {};
};
