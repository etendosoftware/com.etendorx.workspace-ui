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

import { fireEvent, render, screen } from "@testing-library/react";
import { CollapsibleSection } from "../CollapsibleSection";

const SECTION_TITLE = "GL Items";
const CHILDREN_TEXT = "section-body";
const SECTION_TEST_ID = "test-section";

const renderSection = (props: Partial<React.ComponentProps<typeof CollapsibleSection>> = {}) =>
  render(
    <CollapsibleSection title={SECTION_TITLE} data-testid={SECTION_TEST_ID} {...props}>
      <span>{CHILDREN_TEXT}</span>
    </CollapsibleSection>
  );

describe("CollapsibleSection", () => {
  it("renders the title and children expanded by default", () => {
    renderSection();

    expect(screen.getByText(SECTION_TITLE)).toBeInTheDocument();
    const body = screen.getByText(CHILDREN_TEXT).parentElement as HTMLElement;
    expect(body).toHaveStyle({ display: "block" });
  });

  it("renders collapsed when initiallyExpanded is false", () => {
    renderSection({ initiallyExpanded: false });

    const body = screen.getByText(CHILDREN_TEXT).parentElement as HTMLElement;
    expect(body).toHaveStyle({ display: "none" });
  });

  it("toggles the body on click", () => {
    renderSection({ initiallyExpanded: true });

    const toggle = screen.getByRole("button", { name: SECTION_TITLE });
    const body = screen.getByText(CHILDREN_TEXT).parentElement as HTMLElement;

    expect(body).toHaveStyle({ display: "block" });
    fireEvent.click(toggle);
    expect(body).toHaveStyle({ display: "none" });
    fireEvent.click(toggle);
    expect(body).toHaveStyle({ display: "block" });
  });
});
