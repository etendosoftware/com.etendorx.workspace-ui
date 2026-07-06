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

/**
 * Classic `OB.Styles.MessageBar` CSS class names, preserved verbatim so HTML
 * built by migrated scripts keeps the original class attributes. The matching
 * styles ship with the in-modal message bar component; until then these are
 * only inert class strings.
 */
export const MESSAGE_BAR_STYLES = {
  leftMsgContainerStyle: "OBMessageBarLeftMsgContainer",
  rightMsgContainerStyle: "OBMessageBarRightMsgContainer",
  rightMsgTextStyle: "OBMessageBarRightMsgText",
} as const;

/**
 * Builds the `OB.Styles` namespace. Seeded with `MessageBar`; the object stays
 * extensible so module-specific styles (e.g. `OB.Styles.OBWPACK`) can be added
 * by migrated scripts using the idiomatic `OB.Styles.X = OB.Styles.X || {}`
 * guard.
 */
export function createStyles(): Record<string, unknown> {
  return {
    MessageBar: { ...MESSAGE_BAR_STYLES },
  };
}
