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

import { render } from "@testing-library/react";
import SuggestionBox, { SUGGESTION_ATTRIBUTES } from "../SuggestionBox";

/** Element of the rendered suggestion that carries `attribute`. */
const partWith = (container: HTMLElement, attribute: string) => container.querySelector(`[${attribute}]`);

describe("SuggestionBox", () => {
  it("shows the rest of the suggestion after the typed text, marked for a container to restyle it", () => {
    const { container } = render(<SuggestionBox suggestion="sales order" value="sal" />);

    expect(partWith(container, SUGGESTION_ATTRIBUTES.TEXT)).toHaveTextContent(/^es order$/);
    expect(partWith(container, SUGGESTION_ATTRIBUTES.BOX)).toBeInTheDocument();
    expect(partWith(container, SUGGESTION_ATTRIBUTES.TAB_HINT)).toHaveTextContent("Tab");
  });
});
