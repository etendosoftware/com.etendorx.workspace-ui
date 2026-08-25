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
 * @fileoverview Registry mapping a custom-component schema `type` to the component that renders it.
 *
 * Before this existed the channel was hard-wired to `warehouseProcess` in two places: the guard that
 * decides whether an onLoad result is a usable schema, and the branch that picked the component. Both
 * now consult this map, so registering a schema type is the whole cost of adding a custom component.
 *
 * Registering a type is deliberate: an unregistered `type` is discarded and the modal falls through to
 * its standard render, which is the same behaviour any non-warehouse schema had before.
 */

import type React from "react";
import { GenericWarehouseProcess } from "./GenericWarehouseProcess";
import { MiddlewareTokenProcess } from "./MiddlewareTokenProcess";
import type { CustomProcessComponentProps } from "./types";

export const CUSTOM_COMPONENT_REGISTRY: Record<string, React.ComponentType<CustomProcessComponentProps>> = {
  warehouseProcess: GenericWarehouseProcess as React.ComponentType<CustomProcessComponentProps>,
  middlewareTokenProcess: MiddlewareTokenProcess as React.ComponentType<CustomProcessComponentProps>,
};

/**
 * Resolves the component for a schema type.
 *
 * @param type - The `type` discriminator returned by the process onLoad.
 * @returns The registered component, or undefined when the type is unknown.
 */
export const getCustomComponent = (type: unknown): React.ComponentType<CustomProcessComponentProps> | undefined => {
  // hasOwn, not a bare lookup: a schema whose type happens to be "constructor" or "toString" would
  // otherwise resolve to an inherited Object member and be handed to React as a component.
  if (typeof type !== "string" || !Object.hasOwn(CUSTOM_COMPONENT_REGISTRY, type)) return undefined;
  return CUSTOM_COMPONENT_REGISTRY[type];
};

/**
 * True when a schema type has a component able to render it. Used to decide whether an onLoad result
 * is worth keeping, so a process whose onLoad returns something unrelated is discarded exactly as
 * before rather than reaching a component that cannot read it.
 *
 * @param type - The `type` discriminator returned by the process onLoad.
 */
export const isRegisteredCustomSchema = (type: unknown): boolean => !!getCustomComponent(type);
