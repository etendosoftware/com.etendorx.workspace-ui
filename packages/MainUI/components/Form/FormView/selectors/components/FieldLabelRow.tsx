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

import type React from "react";
import Asterisk from "../../../../../../ComponentLibrary/src/assets/icons/asterisk.svg";

/** Accessible name of the required mark. */
export const REQUIRED_MARK_LABEL = "required";

/** Size of the required-mark slot; it is kept even when the field is optional, so asterisks line up. */
const ASTERISK_SLOT_CLASSES = "h-3 w-3 min-w-3 min-h-3 shrink-0";

/**
 * Dotted leader between the label and the field. It keeps a minimum width, so it never shrinks to a few stray
 * dots or disappears, and its dots start from the field side.
 */
export const FIELD_LEADER_CLASSES =
  "flex-1 min-w-4 self-center h-[2px] bg-[length:4px_2px] bg-repeat-x bg-right bg-[radial-gradient(circle,var(--color-transparent-neutral-20)_1px,transparent_1px)]";

interface FieldLabelRowProps {
  /** The label element. */
  label: React.ReactNode;
  mandatory: boolean;
  /** Width class of the label column. */
  widthClassName: string;
  /** Test id of the required mark. */
  asteriskTestId?: string;
}

/**
 * Label column of a form field or process parameter: the label, the dotted leader and the required mark at the
 * end of the column, right next to the field. Placed there, the asterisks of a column line up whatever the
 * label length.
 */
export const FieldLabelRow = ({ label, mandatory, widthClassName, asteriskTestId }: FieldLabelRowProps) => (
  <div className={`${widthClassName} flex min-w-0 items-center gap-2 pr-2`}>
    {label}
    <div className={FIELD_LEADER_CLASSES} />
    {mandatory ? (
      <Asterisk
        className={`${ASTERISK_SLOT_CLASSES} fill-(--color-error-main)`}
        aria-label={REQUIRED_MARK_LABEL}
        data-testid={asteriskTestId}
      />
    ) : (
      <span className={ASTERISK_SLOT_CLASSES} aria-hidden="true" />
    )}
  </div>
);

export default FieldLabelRow;
