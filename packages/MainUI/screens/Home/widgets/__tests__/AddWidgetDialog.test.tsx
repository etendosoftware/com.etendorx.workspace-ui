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
import type { WidgetClass } from "@workspaceui/api-client/src/api/dashboard";
import AddWidgetDialog from "@/screens/Home/widgets/AddWidgetDialog";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const QUERY_LIST_CLASS = {
  widgetClassId: "ql",
  name: "query",
  title: "Query list",
  description: "Shows the rows of a query",
  type: "QUERY_LIST",
  params: [],
} as unknown as WidgetClass;

const renderDialog = () =>
  render(
    <AddWidgetDialog
      open
      widgetClasses={[QUERY_LIST_CLASS]}
      isLoadingClasses={false}
      classesError={null}
      isAdding={false}
      onClose={jest.fn()}
      onAdd={jest.fn()}
    />
  );

describe("AddWidgetDialog contrast", () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal ??= jest.fn();
    HTMLDialogElement.prototype.close ??= jest.fn();
  });

  it("uses a dark text on the tinted type badge, and a light one in dark mode", () => {
    renderDialog();

    const badge = screen.getByText("QUERY LIST");
    expect(badge).toHaveClass("text-[11px]", "text-cyan-800", "dark:text-cyan-300");
  });

  it("shows the card description with the readable secondary colour", () => {
    renderDialog();

    expect(screen.getByText(QUERY_LIST_CLASS.description as string)).toHaveClass("text-baseline-70");
  });

  it("shows the Cancel button with the readable secondary colour", () => {
    renderDialog();

    expect(screen.getByTestId("AddWidgetDialog__cancel")).toHaveClass("text-baseline-70");
  });

  it("paints the primary action with the accent colour", () => {
    renderDialog();

    expect(screen.getByTestId("AddWidgetDialog__add")).toHaveClass("bg-(--ui-accent)");
  });
});
