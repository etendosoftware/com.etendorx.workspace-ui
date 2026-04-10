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

import { useEffect, useRef, useState } from "react";
import ArchiveIcon from "../../../assets/icons/archive.svg?react";
import ChevronDownIcon from "../../../assets/icons/chevron-down.svg?react";
import EditIcon from "../../../assets/icons/edit-3.svg?react";
import MessageSquareIcon from "../../../assets/icons/message-square.svg?react";
import PlusIcon from "../../../assets/icons/plus.svg?react";
import RestoreIcon from "../../../assets/icons/rotate-ccw.svg?react";
import SearchIcon from "../../../assets/icons/search.svg?react";
import SidebarIcon from "../../../assets/icons/sidebar.svg?react";
import TrashIcon from "../../../assets/icons/trash.svg?react";
import IconButton from "../../IconButton";
import type { ConversationListProps } from "../types";

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  archivedConversations = [],
  onSelectConversation,
  onNewConversation,
  onCloseSidebar,
  isLoading,
  onRenameConversation,
  onDeleteConversation,
  onRestoreConversation,
  onPermanentDeleteConversation,
  onToggleArchive,
  archiveExpanded = false,
  archivedLoading = false,
  searchQuery = "",
  onSearchQueryChange,
  translations,
}) => {
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingConversationId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingConversationId]);

  const startEditing = (conversationId: string, currentTitle?: string) => {
    setEditingConversationId(conversationId);
    setEditingTitle(currentTitle || "");
  };

  const cancelEditing = () => {
    setEditingConversationId(null);
    setEditingTitle("");
  };

  const saveEditing = () => {
    if (editingConversationId && editingTitle.trim() && onRenameConversation) {
      onRenameConversation(editingConversationId, editingTitle.trim());
    }
    cancelEditing();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--color-dynamic-main)" />
        <p className="mt-4 text-(--color-transparent-neutral-60)">{translations.loading}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-(--color-transparent-neutral-20) flex items-center gap-2">
        {onCloseSidebar && (
          <IconButton
            onClick={onCloseSidebar}
            tooltip={translations.closeSidebar || "Close sidebar"}
            ariaLabel="Close sidebar">
            <SidebarIcon />
          </IconButton>
        )}
        <button
          type="button"
          onClick={onNewConversation}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-(--color-dynamic-main) text-white rounded-lg hover:bg-(--color-dynamic-dark) transition-colors">
          <PlusIcon className="w-5 h-5" fill="currentColor" />
          <span className="font-medium">{translations.newConversation}</span>
        </button>
      </div>

      <div className="px-4 py-3 border-b border-(--color-transparent-neutral-20)">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="var(--color-transparent-neutral-50)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange?.(event.target.value)}
            placeholder={translations.searchPlaceholder || "Search conversations"}
            className="w-full rounded-lg border border-(--color-transparent-neutral-20) bg-white py-2 pl-10 pr-3 text-sm text-(--color-transparent-neutral-80) outline-none focus:border-(--color-dynamic-main)"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageSquareIcon className="w-16 h-16 mb-4" fill="var(--color-transparent-neutral-40)" />
            <p className="text-(--color-transparent-neutral-60) mb-2">{translations.noConversations}</p>
            <p className="text-sm text-(--color-transparent-neutral-50)">{translations.startNewConversation}</p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="w-full flex items-start gap-3 p-3 mb-2 rounded-lg hover:bg-(--color-transparent-neutral-10) transition-colors text-left group">
                <button
                  type="button"
                  onClick={() => editingConversationId !== conversation.id && onSelectConversation(conversation.id)}
                  className="flex items-start gap-3 flex-1 min-w-0 text-left">
                  <MessageSquareIcon
                    className="w-5 h-5 flex-shrink-0 mt-0.5 group-hover:fill-(--color-dynamic-main)"
                    fill="var(--color-transparent-neutral-60)"
                  />
                  <div className="flex-1 min-w-0">
                    {editingConversationId === conversation.id ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        onBlur={saveEditing}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") saveEditing();
                          if (event.key === "Escape") cancelEditing();
                        }}
                        onClick={(event) => event.stopPropagation()}
                        className="w-full rounded border border-(--color-dynamic-main) px-2 py-1 text-sm outline-none"
                      />
                    ) : (
                      <p className="text-(--color-transparent-neutral-80) font-medium truncate group-hover:text-(--color-dynamic-main) transition-colors">
                        {conversation.title || translations.untitledConversation || "Untitled Conversation"}
                      </p>
                    )}
                  </div>
                </button>

                {editingConversationId !== conversation.id && (
                  <div className="hidden group-hover:flex items-center gap-1">
                    {onRenameConversation && (
                      <button
                        type="button"
                        onClick={() => startEditing(conversation.id, conversation.title)}
                        title={translations.renameConversation || "Rename conversation"}
                        className="p-1 rounded-md border border-(--color-transparent-neutral-20) bg-white text-(--color-transparent-neutral-80) hover:text-(--color-dynamic-main) hover:border-(--color-dynamic-main) transition-colors">
                        <EditIcon className="w-4 h-4" />
                      </button>
                    )}
                    {onDeleteConversation && (
                      <button
                        type="button"
                        onClick={() => onDeleteConversation(conversation.id)}
                        title={translations.deleteConversation || "Hide conversation"}
                        className="p-1 rounded-md border border-(--color-transparent-neutral-20) bg-white text-(--color-transparent-neutral-80) hover:text-red-600 hover:border-red-300 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-(--color-transparent-neutral-20)">
        <button
          type="button"
          onClick={onToggleArchive}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-(--color-transparent-neutral-70) hover:bg-(--color-transparent-neutral-10) transition-colors">
          <span className="flex items-center gap-2">
            <ArchiveIcon className="w-4 h-4" />
            {translations.archivedTitle || "Archived"}
            {archivedConversations.length > 0 ? ` (${archivedConversations.length})` : ""}
          </span>
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${archiveExpanded ? "rotate-180" : ""}`} />
        </button>

        {archiveExpanded && (
          <div className="max-h-56 overflow-y-auto border-t border-(--color-transparent-neutral-20) bg-(--color-transparent-neutral-5)">
            {archivedLoading ? (
              <div className="p-4 text-sm text-(--color-transparent-neutral-60)">{translations.loading}</div>
            ) : archivedConversations.length === 0 ? (
              <div className="p-4 text-sm text-(--color-transparent-neutral-50)">
                {translations.noArchivedConversations || "No archived conversations"}
              </div>
            ) : (
              <div className="p-2">
                {archivedConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="w-full flex items-start gap-3 p-3 mb-2 rounded-lg hover:bg-white transition-colors text-left group">
                    <ArchiveIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-(--color-transparent-neutral-50)" />
                    <div className="flex-1 min-w-0">
                      <p className="text-(--color-transparent-neutral-70) font-medium truncate">
                        {conversation.title || translations.untitledConversation || "Untitled Conversation"}
                      </p>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-1">
                      {onRestoreConversation && (
                        <button
                          type="button"
                          onClick={() => onRestoreConversation(conversation.id)}
                          title={translations.restoreConversation || "Restore conversation"}
                          className="p-1 rounded-md border border-(--color-transparent-neutral-20) bg-white text-(--color-transparent-neutral-80) hover:text-green-600 hover:border-green-300 transition-colors">
                          <RestoreIcon className="w-4 h-4" />
                        </button>
                      )}
                      {onPermanentDeleteConversation && (
                        <button
                          type="button"
                          onClick={() => onPermanentDeleteConversation(conversation.id)}
                          title={translations.permanentDeleteConversation || "Delete permanently"}
                          className="p-1 rounded-md border border-(--color-transparent-neutral-20) bg-white text-(--color-transparent-neutral-80) hover:text-red-600 hover:border-red-300 transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
