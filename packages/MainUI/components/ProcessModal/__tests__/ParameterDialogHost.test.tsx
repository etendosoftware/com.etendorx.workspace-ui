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

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ParameterDialogHost from "../ParameterDialogHost";
import {
  type CollectedValue,
  type DynamicFormField,
  openParameterDialog,
} from "@/utils/processes/definition/parameterDialogStore";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Replace the heavy selector tree with a marker; the host owns form seeding and
// value collection, which is what this suite verifies.
jest.mock("../selectors/ProcessParameterSelector", () => ({
  __esModule: true,
  default: ({ parameter }: { parameter: { name: string } }) => <div data-testid={`field-${parameter.name}`} />,
}));

const FIELDS: DynamicFormField[] = [
  { id: "p1", name: "Reference", inputType: "TEXT", defaultText: "abc" },
  { id: "p2", name: "Confirm", inputType: "CHECK", defaultCheck: "Y" },
];

describe("ParameterDialogHost", () => {
  it("renders nothing when no dialog is queued", () => {
    const { container } = render(<ParameterDialogHost />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the queued fields and resolves with the seeded defaults on confirm", async () => {
    const user = userEvent.setup();
    render(<ParameterDialogHost />);

    let resolved: CollectedValue[] | null | undefined;
    act(() => {
      openParameterDialog({ title: "Pick", fields: FIELDS }).then((v) => {
        resolved = v;
      });
    });

    expect(await screen.findByTestId("field-Reference")).toBeInTheDocument();
    expect(screen.getByTestId("field-Confirm")).toBeInTheDocument();

    await user.click(screen.getByText("common.confirm"));

    expect(resolved).toEqual([
      { id: "p1", name: "Reference", inputType: "TEXT", value: "abc" },
      { id: "p2", name: "Confirm", inputType: "CHECK", value: true },
    ]);
  });

  it("resolves with null when cancelled", async () => {
    const user = userEvent.setup();
    render(<ParameterDialogHost />);

    let resolved: CollectedValue[] | null | undefined;
    act(() => {
      openParameterDialog({ fields: FIELDS }).then((v) => {
        resolved = v;
      });
    });

    await screen.findByText("common.cancel");
    await user.click(screen.getByText("common.cancel"));

    expect(resolved).toBeNull();
  });
});
