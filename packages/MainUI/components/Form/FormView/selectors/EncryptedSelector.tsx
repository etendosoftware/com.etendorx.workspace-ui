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

import type { Field } from "@workspaceui/api-client/src/api/types";
import { PasswordSelector } from "./PasswordSelector";

interface EncryptedSelectorProps {
  field: Field;
  isReadOnly: boolean;
  deencryptable: boolean;
}

const MASKED_DISPLAY = "●●●●●●";

/**
 * Renders fields where column.displayEncription=true.
 *
 * View mode (isReadOnly=true): always shows ●●●●●● regardless of the real value.
 * Edit mode (isReadOnly=false): delegates to PasswordSelector.
 *   - deencryptable=true: eye toggle available.
 *   - deencryptable=false: always masked, no toggle.
 */
export function EncryptedSelector({ field, isReadOnly, deencryptable }: EncryptedSelectorProps) {
  if (isReadOnly) {
    return (
      <span
        className="text-sm select-none tracking-widest"
        aria-label="encrypted field"
        data-testid={`EncryptedSelector__masked__${field.id}`}>
        {MASKED_DISPLAY}
      </span>
    );
  }

  return (
    <PasswordSelector field={field} showToggle={deencryptable} data-testid={`EncryptedSelector__input__${field.id}`} />
  );
}
