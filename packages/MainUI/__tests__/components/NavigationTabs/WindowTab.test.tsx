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
import WindowTab from "@/components/NavigationTabs/WindowTab";

jest.mock("@workspaceui/componentlibrary/src/assets/icons/folder.svg", () => ({
  __esModule: true,
  default: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderTab = (icon?: React.ReactNode) =>
  render(<WindowTab title="Tab" isActive={false} onActivate={jest.fn()} onClose={jest.fn()} icon={icon} />);

describe("WindowTab", () => {
  it("shows the folder icon by default", () => {
    renderTab();

    expect(screen.getByTestId("FolderIcon__15c554")).toBeInTheDocument();
  });

  it("shows the given icon instead of the folder one", () => {
    renderTab(<span data-testid="CustomIcon" />);

    expect(screen.getByTestId("CustomIcon")).toBeInTheDocument();
    expect(screen.queryByTestId("FolderIcon__15c554")).not.toBeInTheDocument();
  });

  describe("activation", () => {
    const setup = () => {
      const onActivate = jest.fn();
      const onClose = jest.fn();
      render(<WindowTab title="Tab" isActive={false} onActivate={onActivate} onClose={onClose} />);
      // The tab itself is the element that holds the padding around the icon and the label.
      const tab = screen.getByText("Tab").closest("button")?.parentElement as HTMLElement;
      return { onActivate, onClose, tab };
    };

    it("activates the window when the label is clicked", () => {
      const { onActivate } = setup();

      fireEvent.click(screen.getByText("Tab"));

      expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it("activates the window when the tab is clicked outside its icon and label", () => {
      const { onActivate, tab } = setup();

      fireEvent.click(tab);

      expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it("closes the window without activating it when the close button is clicked", () => {
      const { onActivate, onClose } = setup();

      fireEvent.click(screen.getByTitle("primaryTabs.closeWindow"));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onActivate).not.toHaveBeenCalled();
    });
  });
});
