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

import type { ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { RichTextSelector } from "../RichTextSelector";
import { DatetimeSelector } from "../DatetimeSelector";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn(), revalidateTag: jest.fn() }));
jest.mock("@/app/actions/revalidate", () => ({ revalidateDopoProcess: jest.fn() }));
jest.mock("dompurify", () => ({ __esModule: true, default: { sanitize: (html: string) => html } }));

// A programmatic setValue (callout, data refresh, default value) does not re-render the form root, so a
// selector must subscribe to its own value to show it.
let methods: UseFormReturn | undefined;
const Form = ({ defaults, children }: { defaults: Record<string, unknown>; children: ReactNode }) => {
  methods = useForm({ defaultValues: defaults });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

const field = (overrides: Partial<Field>) =>
  ({ id: "f1", name: "F", columnName: "F", column: {}, ...overrides }) as unknown as Field;

describe("selectors follow programmatic value changes", () => {
  it("RichTextSelector shows a value set by setValue", () => {
    render(
      <Form defaults={{ note: "<b>old</b>" }}>
        <RichTextSelector field={field({ id: "rt", hqlName: "note" })} isReadOnly={true} />
      </Form>
    );
    act(() => methods?.setValue("note", "<b>new</b>"));
    expect(screen.getByTestId("RichTextSelector__readonly__rt").innerHTML).toContain("new");
  });

  it("DatetimeSelector shows a value set by setValue", () => {
    const { container } = render(
      <Form defaults={{ when: "2025-01-01T10:00" }}>
        <DatetimeSelector field={field({ id: "dt", hqlName: "when" })} isReadOnly={false} />
      </Form>
    );
    const display = () =>
      [...container.querySelectorAll("input")].find((input) => input.type !== "datetime-local")?.value ?? "";
    expect(display()).toContain("10:00");
    act(() => methods?.setValue("when", "2025-02-02T11:30"));
    expect(display()).toContain("11:30");
  });
});
