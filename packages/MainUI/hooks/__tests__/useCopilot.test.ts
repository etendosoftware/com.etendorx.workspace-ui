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

import { act, renderHook } from "@testing-library/react";
import { useCopilot } from "../useCopilot";

const mockCloseConnection = jest.fn();
const mockStartSSEConnection = jest.fn().mockResolvedValue(undefined);

const mockCopilotClient = {
  handleLargeQuestion: jest.fn(async (params) => params),
  uploadFile: jest.fn(),
  getConversations: jest.fn(),
  getArchivedConversations: jest.fn(),
  getConversationMessages: jest.fn(),
  generateTitle: jest.fn(),
  renameConversation: jest.fn(),
  deleteConversation: jest.fn(),
  restoreConversation: jest.fn(),
  permanentDeleteConversation: jest.fn(),
};

jest.mock("../useCopilotClient", () => ({
  useCopilotClient: () => mockCopilotClient,
}));

jest.mock("../useSSEConnection", () => ({
  useSSEConnection: () => ({
    startSSEConnection: mockStartSSEConnection,
    closeConnection: mockCloseConnection,
    isConnected: false,
    reconnectAttempts: 0,
  }),
}));

describe("useCopilot", () => {
  const assistantA = { app_id: "assistant-a", name: "Assistant A" };
  const assistantB = { app_id: "assistant-b", name: "Assistant B" };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCopilotClient.getConversations.mockResolvedValue([
      { id: "conv-1", title: "Alpha conversation" },
      { id: "conv-2", title: "Beta thread" },
    ]);
    mockCopilotClient.getArchivedConversations.mockResolvedValue([{ id: "arch-1", title: "Archived A" }]);
    mockCopilotClient.getConversationMessages.mockResolvedValue({
      id: "conv-1",
      messages: [{ text: "hello", sender: "user", timestamp: "10:00" }],
    });
    mockCopilotClient.deleteConversation.mockResolvedValue({ success: true });
    mockCopilotClient.restoreConversation.mockResolvedValue({ success: true });
    mockCopilotClient.permanentDeleteConversation.mockResolvedValue({ success: true });
    mockCopilotClient.renameConversation.mockResolvedValue({ success: true });
    mockCopilotClient.generateTitle.mockResolvedValue("Generated");
  });

  it("filters conversations by search query without mutating the full list", async () => {
    const { result } = renderHook(() => useCopilot());

    act(() => {
      result.current.handleSelectAssistant(assistantA);
    });

    await act(async () => {
      await result.current.loadConversations();
    });

    act(() => {
      result.current.setSearchQuery("beta");
    });

    expect(result.current.conversations).toEqual([{ id: "conv-2", title: "Beta thread" }]);
    expect(result.current.allConversations).toEqual([
      { id: "conv-1", title: "Alpha conversation" },
      { id: "conv-2", title: "Beta thread" },
    ]);
  });

  it("clears active conversation state when deleting the selected conversation", async () => {
    const { result } = renderHook(() => useCopilot());

    act(() => {
      result.current.handleSelectAssistant(assistantA);
    });

    await act(async () => {
      await result.current.loadConversations();
      await result.current.handleSelectConversation("conv-1");
    });

    expect(result.current.messages).toHaveLength(1);

    await act(async () => {
      await result.current.deleteConversation("conv-1");
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.allConversations).toEqual([{ id: "conv-2", title: "Beta thread" }]);
    expect(mockCloseConnection).toHaveBeenCalled();

    await act(async () => {
      await result.current.handleSendMessage("new question");
    });

    expect(mockCopilotClient.handleLargeQuestion).toHaveBeenCalledWith({
      question: "new question",
      app_id: "assistant-a",
    });
    expect(mockStartSSEConnection).toHaveBeenCalledWith({
      question: "new question",
      app_id: "assistant-a",
    });
  });

  it("loads archived conversations and resets archive state when assistant changes", async () => {
    mockCopilotClient.getArchivedConversations
      .mockResolvedValueOnce([{ id: "arch-1", title: "Archived A" }])
      .mockResolvedValueOnce([{ id: "arch-2", title: "Archived B" }]);

    const { result } = renderHook(() => useCopilot());

    act(() => {
      result.current.handleSelectAssistant(assistantA);
      result.current.setSearchQuery("alpha");
    });

    await act(async () => {
      await result.current.toggleArchiveExpanded();
    });

    expect(result.current.archiveExpanded).toBe(true);
    expect(result.current.archivedConversations).toEqual([{ id: "arch-1", title: "Archived A" }]);
    expect(mockCopilotClient.getArchivedConversations).toHaveBeenCalledWith("assistant-a");

    act(() => {
      result.current.handleSelectAssistant(assistantB);
    });

    expect(result.current.archiveExpanded).toBe(false);
    expect(result.current.archivedConversations).toEqual([]);
    expect(result.current.searchQuery).toBe("");

    await act(async () => {
      await result.current.toggleArchiveExpanded();
    });

    expect(result.current.archivedConversations).toEqual([{ id: "arch-2", title: "Archived B" }]);
    expect(mockCopilotClient.getArchivedConversations).toHaveBeenCalledWith("assistant-b");
  });

  it("restores and permanently deletes archived conversations", async () => {
    mockCopilotClient.getArchivedConversations.mockResolvedValue([{ id: "arch-1", title: "Archived A" }]);

    const { result } = renderHook(() => useCopilot());

    act(() => {
      result.current.handleSelectAssistant(assistantA);
    });

    await act(async () => {
      await result.current.loadConversations();
      await result.current.toggleArchiveExpanded();
    });

    await act(async () => {
      await result.current.restoreConversation("arch-1");
    });

    expect(result.current.archivedConversations).toEqual([]);
    expect(result.current.allConversations[0]).toEqual({ id: "arch-1", title: "Archived A" });

    mockCopilotClient.getArchivedConversations.mockResolvedValue([{ id: "arch-3", title: "Archived C" }]);

    await act(async () => {
      await result.current.loadArchivedConversations();
    });

    expect(result.current.archivedConversations).toEqual([{ id: "arch-3", title: "Archived C" }]);

    await act(async () => {
      await result.current.permanentDeleteConversation("arch-3");
    });

    expect(result.current.archivedConversations).toEqual([]);
    expect(mockCopilotClient.permanentDeleteConversation).toHaveBeenCalledWith("arch-3");
  });
});
