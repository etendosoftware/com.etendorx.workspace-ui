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

import { useCallback, useState } from "react";

/**
 * State of the "Save as default" checkbox of the profile modal, for the components hosting it.
 *
 * The checkbox only applies to the profile change it was ticked for: once a change is applied it
 * goes back to unticked, so the next change of the session is not silently saved as the user's
 * default. Classic gets the same by reloading the whole application after every profile change.
 *
 * @returns the checkbox value, its change handler and the callback for an applied profile change.
 */
export function useSaveAsDefault() {
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  const onSaveAsDefaultChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSaveAsDefault(event.target.checked);
  }, []);

  const onProfileApplied = useCallback(() => {
    setSaveAsDefault(false);
  }, []);

  return { saveAsDefault, onSaveAsDefaultChange, onProfileApplied };
}
