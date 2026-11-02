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

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProcessMenu from "../ProcessMenu";
import type { ProcessButton } from "@/components/ProcessModal/types";

jest.mock("@workspaceui/componentlibrary/src/components/Menu", () => {
  return function MockMenu({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-menu">{children}</div>;
  };
});

const createButton = (id: string, isProcessAccessible?: boolean): ProcessButton =>
  ({
    id,
    name: `Process ${id}`,
    hqlName: id,
    processAction: { id: `action-${id}` },
    isProcessAccessible,
  }) as unknown as ProcessButton;

const renderMenu = (processButtons: ProcessButton[], onProcessClick = jest.fn()) => {
  render(
    <ProcessMenu
      anchorEl={document.body}
      onClose={jest.fn()}
      processButtons={processButtons}
      onProcessClick={onProcessClick}
      hasSelection
    />
  );
  return onProcessClick;
};

const getItem = (name: string) => screen.getByText(name);

describe("ProcessMenu — role process access", () => {
  it("keeps a process the role cannot run visible but disabled, as Classic does", () => {
    const onProcessClick = renderMenu([createButton("denied", false)]);

    const item = getItem("Process denied");
    fireEvent.click(item);
    fireEvent.keyDown(item, { key: "Enter" });

    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item).toHaveClass("cursor-not-allowed");
    expect(onProcessClick).not.toHaveBeenCalled();
  });

  it.each([true, undefined])("runs a process whose access flag is %s", (isProcessAccessible) => {
    const button = createButton("allowed", isProcessAccessible);
    const onProcessClick = renderMenu([button]);

    const item = getItem("Process allowed");
    fireEvent.click(item);

    expect(item).toHaveAttribute("aria-disabled", "false");
    expect(onProcessClick).toHaveBeenCalledWith(button);
  });
});
