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
import CopilotPopup, { COLLAPSED_PANEL_POSITION, COLLAPSED_PANEL_SIZE, PANEL_SURFACE } from "../index";
import type { CopilotPopupProps } from "../../types";

jest.mock("../ChatInterface", () => ({
  __esModule: true,
  default: () => <div data-testid="chat-interface" />,
}));

const PROFILE_LABEL = "Copilot Profile";

const renderPopup = (isExpanded = false) => {
  const props = {
    open: true,
    onClose: jest.fn(),
    isExpanded,
    messages: [],
    assistants: [],
    selectedAssistant: null,
    isLoading: false,
    onSelectAssistant: jest.fn(),
    onSendMessage: jest.fn(),
    onResetConversation: jest.fn(),
    translations: {
      copilotProfile: PROFILE_LABEL,
      backToSelection: "",
      minimize: "",
      maximize: "",
      close: "",
      contextText: "",
    },
  } as unknown as CopilotPopupProps;
  render(<CopilotPopup {...props} />);
  const panel = screen.getByText(PROFILE_LABEL).closest(".flex-col") as HTMLElement;
  return { panel, frame: panel.parentElement as HTMLElement };
};

describe("CopilotPopup", () => {
  it("anchors the collapsed panel to the content area, from below the top bar to above the status bar", () => {
    const { frame, panel } = renderPopup();

    expect(frame).toHaveClass(...COLLAPSED_PANEL_POSITION.split(" "));
    expect(panel).toHaveClass(...COLLAPSED_PANEL_SIZE.split(" "));
  });

  it("fills the screen with its inset when expanded", () => {
    const { frame } = renderPopup(true);

    expect(frame).toHaveClass("inset-4");
  });

  it("uses the flat card surface in both themes instead of the pastel gradient", () => {
    const { panel } = renderPopup();

    expect(panel).toHaveClass(PANEL_SURFACE);
    expect(panel.className).not.toContain("gradient");
  });
});
