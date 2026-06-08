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

import { MESSAGE_BAR_TYPES } from "@/utils/processes/definition/messageBarStore";
import { getStoredPreferences, setStoredPreference } from "@/utils/propertyStore";
import { createAction } from "./action";
import { createDatasourceManager } from "./datasource";
import { createFormat } from "./format";
import { createI18N } from "./i18n";
import { JSToOBMasked } from "./number";
import { createRemoteCallManager } from "./remoteCallManager";
import { createStyles } from "./styles";
import type { OBPropertyStore, OBShim, OBShimDeps } from "./types";
import { generateRandomString } from "./utilities";

/**
 * Builds the `OB.PropertyStore` namespace. `get` reads a preference (with a
 * case-insensitive fallback); `set` merges a single key into the stored
 * preferences.
 */
function createPropertyStore(): OBPropertyStore {
  return {
    get: (key: string): string | undefined => {
      const prefs = getStoredPreferences();
      if (prefs[key] !== undefined) return String(prefs[key]);
      const lowerKey = key.toLowerCase();
      for (const storedKey of Object.keys(prefs)) {
        if (storedKey.toLowerCase() === lowerKey) return String(prefs[storedKey]);
      }
      return undefined;
    },
    set: (key: string, value: unknown): void => {
      setStoredPreference(key, value);
    },
  };
}

/**
 * Creates the `OB` shim object compatible with legacy Openbravo/Etendo
 * expressions, injected into compiled "Defined Process" scripts so migrated
 * code can use the same `OB.*` API as the classic UI.
 *
 * A single instance is created per process modal (via `buildProcessScriptContext`)
 * and shared across onLoad / onProcess / onChange / onRefresh, so the action
 * registry and any module-namespace writes (`OB.APRM = OB.APRM || {}`) persist
 * across hooks. `Utilities.Action.executeJSON` routes built-in action types to
 * the host through `deps.dispatchBuiltinAction`, `RemoteCallManager.call` runs
 * through `deps.remoteCall`, and `Datasource.create` runs through
 * `deps.fetchDatasource`.
 *
 * @example
 * // Inside a migrated onLoad / onProcess script:
 * const showUOM = OB.PropertyStore.get('UomManagement') === 'Y';
 * const msg = OB.I18N.getLabel('APRM_Confirm', [amount]);
 */
export function createOBShim(deps: OBShimDeps = {}): OBShim {
  return {
    PropertyStore: createPropertyStore(),
    I18N: createI18N(deps),
    Format: createFormat(deps.language),
    Utilities: {
      Number: { JSToOBMasked },
      Action: createAction({ dispatchBuiltinAction: deps.dispatchBuiltinAction }),
      generateRandomString,
    },
    Styles: createStyles(),
    MessageBar: MESSAGE_BAR_TYPES,
    TestRegistry: {
      register: () => {
        /* no-op: test infrastructure is not migrated */
      },
    },
    RemoteCallManager: createRemoteCallManager({ remoteCall: deps.remoteCall }),
    Datasource: createDatasourceManager({ fetchDatasource: deps.fetchDatasource }),
  };
}
