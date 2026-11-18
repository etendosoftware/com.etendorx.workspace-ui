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

import { render, screen } from "@testing-library/react";
import { FIELD_LEADER_CLASSES, FieldLabelRow, REQUIRED_MARK_LABEL } from "../FieldLabelRow";

const LABEL_TEXT = "Business Partner";

const renderRow = (mandatory: boolean) =>
  render(<FieldLabelRow label={<span>{LABEL_TEXT}</span>} mandatory={mandatory} widthClassName="w-[45%]" />);

/** The row is the parent of the label. */
const getRow = () => screen.getByText(LABEL_TEXT).parentElement as HTMLElement;

describe("FieldLabelRow", () => {
  it("places the required mark at the end of the column, after the leader", () => {
    renderRow(true);

    const [label, leader, mark] = Array.from(getRow().children);
    expect(label).toHaveTextContent(LABEL_TEXT);
    expect(leader.className).toBe(FIELD_LEADER_CLASSES);
    expect(mark).toBe(screen.getByLabelText(REQUIRED_MARK_LABEL));
  });

  it("keeps an empty slot of the same size for an optional field, so the asterisks line up", () => {
    renderRow(false);

    expect(screen.queryByLabelText(REQUIRED_MARK_LABEL)).not.toBeInTheDocument();
    const slot = getRow().lastElementChild as HTMLElement;
    expect(slot).toHaveClass("w-3", "shrink-0");
    expect(slot).toHaveAttribute("aria-hidden", "true");
  });

  it("gives the leader a minimum width, so it never shows a few stray dots", () => {
    expect(FIELD_LEADER_CLASSES).toContain("min-w-4");
  });

  it("applies the label column width", () => {
    renderRow(false);

    expect(getRow()).toHaveClass("w-[45%]");
  });
});
