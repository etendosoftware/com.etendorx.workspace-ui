/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

/**
 * @fileoverview Shared contract for custom-component processes.
 *
 * A process flagged with `em_etmeta_custom_component` renders its own React component instead of the
 * standard parameter form. Its `onLoad` returns a schema whose `type` selects that component through
 * the registry in ./registry.
 *
 * The props below are exactly what ProcessDefinitionModal already passed to the single hard-wired
 * component, so adding a schema type costs nothing at the call site. A component that has no use for
 * a given prop (for instance `payscriptPlugin`, which only the warehouse flow registers) ignores it.
 */

import type { WarehousePayScriptPlugin, WarehouseProcessSchema } from "./GenericWarehouseProcess/types";
import type { MiddlewareTokenSchema } from "./MiddlewareTokenProcess/types";

/** Every schema a custom-component `onLoad` may return, discriminated by `type`. */
export type CustomProcessSchema = WarehouseProcessSchema | MiddlewareTokenSchema;

/** The `type` values the registry knows how to render. */
export type CustomProcessSchemaType = CustomProcessSchema["type"];

export interface CustomProcessComponentProps {
  /** Schema returned by the process onLoad. Components narrow it by its `type` discriminator. */
  schema: CustomProcessSchema;
  /** onScan hook from the Payscript registry — only the warehouse flow registers one. */
  payscriptPlugin: WarehousePayScriptPlugin | null;
  /** Raw onProcess function string from processDefinition.etmetaOnprocess. */
  onProcessCode: string | undefined;
  processId: string;
  onClose: () => void;
  onSuccess?: () => void;
}
