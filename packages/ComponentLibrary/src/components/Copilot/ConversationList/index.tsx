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

import MessageSquareIcon from "../../../assets/icons/message-square.svg";
import PlusIcon from "../../../assets/icons/plus.svg";
import IconButton from "../../IconButton";
import SidebarIcon from "../../../assets/icons/sidebar.svg";
import type { ConversationListProps } from "../types";

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
  onNewConversation,
  onCloseSidebar,
  isLoading,
  translations,
}) => {
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
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelectConversation(conversation.id)}
                className="w-full flex items-start gap-3 p-3 mb-2 rounded-lg hover:bg-(--color-transparent-neutral-10) transition-colors text-left group">
                <MessageSquareIcon
                  className="w-5 h-5 flex-shrink-0 mt-0.5 group-hover:fill-(--color-dynamic-main)"
                  fill="var(--color-transparent-neutral-60)"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-(--color-transparent-neutral-80) font-medium truncate group-hover:text-(--color-dynamic-main) transition-colors">
                    {conversation.title || translations.untitledConversation || "Untitled Conversation"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
