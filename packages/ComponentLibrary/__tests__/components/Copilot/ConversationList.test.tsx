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

import { render, screen, fireEvent } from "@testing-library/react";
import ConversationList from "../../../src/components/Copilot/ConversationList";
import type { IConversationSummary } from "@workspaceui/api-client/src/api/copilot";

// Mock icons
jest.mock("../../../src/assets/icons/plus.svg", () => ({
  __esModule: true,
  default: () => <div data-testid="plus-icon" />,
}));

jest.mock("../../../src/assets/icons/sidebar.svg", () => ({
  __esModule: true,
  default: () => <div data-testid="sidebar-icon" />,
}));

// Mock IconButton component
jest.mock("../../../src/components/IconButton", () => ({
  __esModule: true,
  default: ({ onClick, children, tooltip }: any) => (
    <button onClick={onClick} title={tooltip}>
      {children}
    </button>
  ),
}));

describe("ConversationList", () => {
  const mockTranslations = {
    newConversation: "New Conversation",
    noConversations: "No previous conversations",
    startNewConversation: "Start a new conversation to get started",
    loading: "Loading conversations...",
    untitledConversation: "Untitled Conversation",
    closeSidebar: "Close sidebar",
  };

  const mockConversations: IConversationSummary[] = [
    { id: "conv-1", title: "Test Conversation 1" },
    { id: "conv-2", title: "Test Conversation 2" },
    { id: "conv-3" }, // No title
  ];

  const mockHandlers = {
    onSelectConversation: jest.fn(),
    onNewConversation: jest.fn(),
    onCloseSidebar: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should display loading spinner when isLoading is true", () => {
      render(
        <ConversationList
          conversations={[]}
          onSelectConversation={mockHandlers.onSelectConversation}
          onNewConversation={mockHandlers.onNewConversation}
          isLoading={true}
          translations={mockTranslations}
        />
      );

      expect(screen.getByText(mockTranslations.loading)).toBeInTheDocument();
    });

    it("should not display conversations list when loading", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockHandlers.onSelectConversation}
          onNewConversation={mockHandlers.onNewConversation}
          isLoading={true}
          translations={mockTranslations}
        />
      );

      expect(screen.queryByText("Test Conversation 1")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should display empty state when no conversations", () => {
      render(
        <ConversationList
          conversations={[]}
          onSelectConversation={mockHandlers.onSelectConversation}
          onNewConversation={mockHandlers.onNewConversation}
          isLoading={false}
          translations={mockTranslations}
        />
      );

      expect(screen.getByText(mockTranslations.noConversations)).toBeInTheDocument();
      expect(screen.getByText(mockTranslations.startNewConversation)).toBeInTheDocument();
    });
  });

  describe("Conversations Display", () => {
    it("should render all conversations with titles", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockHandlers.onSelectConversation}
          onNewConversation={mockHandlers.onNewConversation}
          isLoading={false}
          translations={mockTranslations}
        />
      );

      expect(screen.getByText("Test Conversation 1")).toBeInTheDocument();
      expect(screen.getByText("Test Conversation 2")).toBeInTheDocument();
    });

    it("should display fallback text for conversations without title", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockHandlers.onSelectConversation}
          onNewConversation={mockHandlers.onNewConversation}
          isLoading={false}
          translations={mockTranslations}
        />
      );

      expect(screen.getByText(mockTranslations.untitledConversation)).toBeInTheDocument();
    });

    it("should call onSelectConversation when conversation is clicked", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockHandlers.onSelectConversation}
          onNewConversation={mockHandlers.onNewConversation}
          isLoading={false}
          translations={mockTranslations}
        />
      );

      const conversationButton = screen.getByText("Test Conversation 1");
      fireEvent.click(conversationButton);

      expect(mockHandlers.onSelectConversation).toHaveBeenCalledWith("conv-1");
      expect(mockHandlers.onSelectConversation).toHaveBeenCalledTimes(1);
    });
  });

  describe("Action Buttons", () => {
    it("should display new conversation button", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockHandlers.onSelectConversation}
          onNewConversation={mockHandlers.onNewConversation}
          isLoading={false}
          translations={mockTranslations}
        />
      );

      expect(screen.getByText(mockTranslations.newConversation)).toBeInTheDocument();
    });

    it("should call onNewConversation when new conversation button is clicked", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockHandlers.onSelectConversation}
          onNewConversation={mockHandlers.onNewConversation}
          isLoading={false}
          translations={mockTranslations}
        />
      );

      const newConversationButton = screen.getByText(mockTranslations.newConversation);
      fireEvent.click(newConversationButton);

      expect(mockHandlers.onNewConversation).toHaveBeenCalledTimes(1);
    });

    it("should display close sidebar button when onCloseSidebar is provided", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockHandlers.onSelectConversation}
          onNewConversation={mockHandlers.onNewConversation}
          onCloseSidebar={mockHandlers.onCloseSidebar}
          isLoading={false}
          translations={mockTranslations}
        />
      );

      const closeSidebarButton = screen.getByTitle(mockTranslations.closeSidebar);
      expect(closeSidebarButton).toBeInTheDocument();
    });

    it("should not display close sidebar button when onCloseSidebar is not provided", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockHandlers.onSelectConversation}
          onNewConversation={mockHandlers.onNewConversation}
          isLoading={false}
          translations={mockTranslations}
        />
      );

      const closeSidebarButton = screen.queryByTitle(mockTranslations.closeSidebar);
      expect(closeSidebarButton).not.toBeInTheDocument();
    });

    it("should call onCloseSidebar when close button is clicked", () => {
      render(
        <ConversationList
          conversations={mockConversations}
          onSelectConversation={mockHandlers.onSelectConversation}
          onNewConversation={mockHandlers.onNewConversation}
          onCloseSidebar={mockHandlers.onCloseSidebar}
          isLoading={false}
          translations={mockTranslations}
        />
      );

      const closeSidebarButton = screen.getByTitle(mockTranslations.closeSidebar);
      fireEvent.click(closeSidebarButton);

      expect(mockHandlers.onCloseSidebar).toHaveBeenCalledTimes(1);
    });
  });

  describe("Generating State", () => {
    it("should display 'Generating...' for conversations with that title", () => {
      const conversationsWithGenerating: IConversationSummary[] = [
        { id: "conv-1", title: "Generating..." },
        { id: "conv-2", title: "Test Conversation" },
      ];

      render(
        <ConversationList
          conversations={conversationsWithGenerating}
          onSelectConversation={mockHandlers.onSelectConversation}
          onNewConversation={mockHandlers.onNewConversation}
          isLoading={false}
          translations={mockTranslations}
        />
      );

      expect(screen.getByText("Generating...")).toBeInTheDocument();
      expect(screen.getByText("Test Conversation")).toBeInTheDocument();
    });
  });
});
