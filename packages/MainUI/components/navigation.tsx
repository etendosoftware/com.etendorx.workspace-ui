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

"use client";

import { useLanguage } from "@/contexts/language";
import type { Language } from "@/contexts/types";
import { UserContext } from "@/contexts/user";
import { useUserContext } from "@/hooks/useUserContext";
import { logger } from "@/utils/logger";
import NotificationIcon from "@workspaceui/componentlibrary/src/assets/icons/bell.svg";
import AddIcon from "@workspaceui/componentlibrary/src/assets/icons/plus.svg";
import PersonIcon from "@workspaceui/componentlibrary/src/assets/icons/user.svg";
import {
  CopilotButton,
  CopilotPopup,
  NotificationButton,
  NotificationModal,
  Waterfall,
  AboutButton,
  AboutModal,
} from "@workspaceui/componentlibrary/src/components";
import useAboutModalOpen from "@workspaceui/componentlibrary/src/components/About/hooks/useAboutModalOpen";
import { useAboutModal } from "@/hooks/about/useAboutModal";
import type { Item } from "@workspaceui/componentlibrary/src/components/DragModal/DragModal.types";
import Nav from "@workspaceui/componentlibrary/src/components/Nav/Nav";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { NOTIFICATIONS, menuItems, sections } from "../mocks";
import { useTranslation } from "../hooks/useTranslation";
import ProfileModal from "./ProfileModal/ProfileModal";
import { useAssistants } from "@/hooks/useAssistants";
import { useCopilotLabels } from "@/hooks/useCopilotLabels";
import { useCopilot } from "@/hooks/useCopilot";
import { buildContextString } from "@/utils/contextUtils";
import type { ContextItem } from "@/hooks/types";
import ConfigurationSection from "./Header/ConfigurationSection";

const handleClose = () => {
  return true;
};

const item: Item[] = [];

const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const {
    setDefaultConfiguration,
    currentRole,
    currentOrganization,
    profile,
    currentWarehouse,
    currentClient,
    changeProfile,
    roles,
    languages,
    isCopilotInstalled,
  } = useContext(UserContext);
  const token = useUserContext();
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const { language, setLanguage, getFlag } = useLanguage();
  const [anchorEl] = useState<HTMLElement | null>(null);

  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotExpanded, setCopilotExpanded] = useState(false);
  const [pendingContextString, setPendingContextString] = useState<string | null>(null);
  const [pendingContextItems, setPendingContextItems] = useState<ContextItem[]>([]);

  const { isOpen: aboutModalOpen, openModal: openAboutModal, closeModal: closeAboutModal } = useAboutModalOpen();
  const { aboutUrl } = useAboutModal();

  const { assistants, getAssistants, invalidateCache, isLoading: isLoadingAssistants } = useAssistants();
  const { labels, getLabels } = useCopilotLabels();

  const handleSaveAsDefaultChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSaveAsDefault(event.target.checked);
  }, []);

  const handleCopilotOpen = useCallback(() => {
    setCopilotOpen(true);
    getAssistants();
  }, [getAssistants]);

  const handleCopilotOpenWithContext = useCallback(
    (contextString: string, contextItems: ContextItem[]) => {
      setPendingContextString(contextString);
      setPendingContextItems(contextItems);
      setCopilotOpen(true);
      getAssistants();
    },
    [getAssistants]
  );

  const handleCopilotClose = useCallback(() => {
    setCopilotOpen(false);
    setPendingContextString(null);
    setPendingContextItems([]);
  }, []);

  const handleCopilotToggleExpanded = useCallback(() => {
    setCopilotExpanded(!copilotExpanded);
  }, [copilotExpanded]);

  const languagesWithFlags = useMemo(() => {
    return languages.map((lang) => ({
      ...lang,
      flagEmoji: getFlag(lang.language as Language),
      displayName: `${getFlag(lang.language as Language)} ${lang.name}`,
    }));
  }, [languages, getFlag]);

  const flagString = getFlag(language);

  const {
    messages,
    selectedAssistant,
    isLoading,
    files,
    handleSendMessage,
    handleSelectAssistant,
    handleResetConversation,
    handleFileUpload,
    handleRemoveFile,
    conversations,
    conversationsLoading,
    loadConversations,
    handleSelectConversation,
  } = useCopilot();

  const handleCopilotSendMessage = useCallback(
    (message: string, _files?: File[]) => {
      if (pendingContextString) {
        const messageWithContext = `${pendingContextString}\n\n${message}`;
        handleSendMessage(messageWithContext);
        setPendingContextString(null);
        setPendingContextItems([]);
      } else {
        handleSendMessage(message);
      }
    },
    [pendingContextString, handleSendMessage]
  );

  const handleRemoveContext = useCallback(
    (contextId: string) => {
      setPendingContextItems((items) => {
        const newItems = items.filter((item) => item.id !== contextId);

        if (newItems.length === 0) {
          setPendingContextString(null);
        } else {
          const newContextString = buildContextString({
            contextItems: newItems,
            registersText: t("copilot.contextPreview.selectedRegisters"),
          });
          setPendingContextString(newContextString);
        }

        return newItems;
      });
    },
    [t]
  );

  useEffect(() => {
    getLabels();
  }, [getLabels]);

  useEffect(() => {
    if (token?.token) {
      if (copilotOpen) {
        handleCopilotClose();
      }

      invalidateCache();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token?.token]);

  useEffect(() => {
    const handleCopilotWithContext = (event: CustomEvent) => {
      const { contextString, contextItems, hasContext } = event.detail;
      if (hasContext) {
        handleCopilotOpenWithContext(contextString, contextItems);
      } else {
        handleCopilotOpen();
      }
    };

    window.addEventListener("openCopilotWithContext", handleCopilotWithContext as EventListener);

    return () => {
      window.removeEventListener("openCopilotWithContext", handleCopilotWithContext as EventListener);
    };
  }, [handleCopilotOpen, handleCopilotOpenWithContext]);

  if (!currentRole) {
    return null;
  }

  return (
    <>
      <Nav title={t("common.notImplemented")} data-testid="Nav__120cc9">
        <Waterfall
          menuItems={menuItems}
          backButtonText={t("modal.secondaryButtonLabel")}
          activateAllText={t("navigation.waterfall.activateAll")}
          deactivateAllText={t("navigation.waterfall.deactivateAll")}
          tooltipWaterfallButton={t("navigation.waterfall.tooltipButton")}
          buttonText={t("navigation.waterfall.buttons")}
          customizeText={t("navigation.waterfall.customize")}
          items={item}
          icon={<AddIcon data-testid="AddIcon__120cc9" />}
          setItems={() => {}}
          data-testid="Waterfall__120cc9"
        />
        <ConfigurationSection data-testid="ConfigurationSection__120cc9" />
        {isCopilotInstalled && (
          <CopilotButton
            onClick={handleCopilotOpen}
            disabled={!isCopilotInstalled}
            tooltip="Copilot"
            data-testid="CopilotButton__120cc9"
          />
        )}
        <AboutButton onClick={openAboutModal} tooltip={t("common.about")} data-testid="AboutButton__120cc9" />
        <AboutModal
          aboutUrl={aboutUrl}
          title={t("common.about")}
          isOpen={aboutModalOpen}
          onClose={closeAboutModal}
          closeButtonText={t("common.close")}
          data-testid="AboutModal__120cc9"
        />
        <NotificationButton
          notifications={NOTIFICATIONS}
          icon={<NotificationIcon data-testid="NotificationIcon__120cc9" />}
          data-testid="NotificationButton__120cc9">
          <NotificationModal
            notifications={NOTIFICATIONS}
            anchorEl={anchorEl}
            onClose={handleClose}
            title={{
              icon: <NotificationIcon fill="#2E365C" data-testid="NotificationIcon__120cc9" />,
              label: t("navigation.notificationModal.title"),
            }}
            linkTitle={{
              label: t("navigation.notificationModal.markAllAsRead"),
              url: "/home",
            }}
            emptyStateImageAlt={t("navigation.notificationModal.emptyStateImageAlt")}
            emptyStateMessage={t("navigation.notificationModal.emptyStateMessage")}
            emptyStateDescription={t("navigation.notificationModal.emptyStateDescription")}
            actionButtonLabel={t("navigation.notificationModal.actionButtonLabel")}
            data-testid="NotificationModal__120cc9"
          />
        </NotificationButton>
        <ProfileModal
          icon={<PersonIcon data-testid="PersonIcon__120cc9" />}
          sections={sections}
          section={""}
          translations={{
            saveAsDefault: t("navigation.profile.saveAsDefault"),
          }}
          currentRole={currentRole}
          currentWarehouse={currentWarehouse}
          currentOrganization={currentOrganization}
          roles={roles}
          saveAsDefault={saveAsDefault}
          onSaveAsDefaultChange={handleSaveAsDefaultChange}
          onLanguageChange={setLanguage}
          language={language}
          languagesFlags={flagString}
          changeProfile={changeProfile}
          onSetDefaultConfiguration={setDefaultConfiguration}
          logger={logger}
          languages={languagesWithFlags}
          userName={profile.name}
          userEmail={profile.email}
          userPhotoUrl={profile.image}
          data-testid="ProfileModal__120cc9"
          currentClient={currentClient}
        />
      </Nav>
      <CopilotPopup
        open={copilotOpen && isCopilotInstalled}
        onClose={handleCopilotClose}
        assistants={assistants}
        labels={labels}
        isExpanded={copilotExpanded}
        onToggleExpanded={handleCopilotToggleExpanded}
        messages={messages}
        selectedAssistant={selectedAssistant}
        isLoading={isLoading}
        onSelectAssistant={handleSelectAssistant}
        onSendMessage={handleCopilotSendMessage}
        onResetConversation={handleResetConversation}
        isLoadingAssistants={isLoadingAssistants}
        hasContextPending={!!pendingContextString}
        contextItems={pendingContextItems}
        onRemoveContext={handleRemoveContext}
        files={files || []}
        onFileSelect={handleFileUpload}
        onRemoveFile={handleRemoveFile}
        conversations={conversations}
        onSelectConversation={handleSelectConversation}
        onLoadConversations={loadConversations}
        conversationsLoading={conversationsLoading}
        translations={{
          copilotProfile: t("copilot.copilotProfile"),
          backToSelection: t("copilot.backToSelection"),
          minimize: t("copilot.minimize"),
          maximize: t("copilot.maximize"),
          close: t("copilot.close"),
          contextText: t("copilot.contextText"),
          selectedRegisters: t("copilot.contextPreview.selectedRegisters"),
          assistantSelector: {
            errorInvalidData: t("copilot.assistantSelector.errorInvalidData"),
            errorNoAssistantsAvailable: t("copilot.assistantSelector.errorNoAssistantsAvailable"),
            defaultDescription: t("copilot.assistantSelector.defaultDescription"),
            welcomeMessage: t("copilot.assistantSelector.welcomeMessage"),
            profilesTitle: t("copilot.assistantSelector.profilesTitle"),
            learnMoreText: t("copilot.assistantSelector.learnMoreText"),
            filterPlaceholder: t("copilot.assistantSelector.filterPlaceholder"),
          },
          messageInput: {
            placeholder: t("copilot.messageInput.placeholder"),
          },
          messageList: {
            contextRecords: t("copilot.messageList.contextRecords"),
            welcomeMessage: t("copilot.messageList.welcomeMessage"),
            typing: t("copilot.messageList.typing"),
            processing: t("copilot.messageList.processing"),
          },
          conversationList: {
            newConversation: t("copilot.conversationList.newConversation"),
            noConversations: t("copilot.conversationList.noConversations"),
            startNewConversation: t("copilot.conversationList.startNewConversation"),
            loading: t("copilot.conversationList.loading"),
            untitledConversation: t("copilot.conversationList.untitledConversation"),
          },
          conversationsButton: t("copilot.conversationsButton"),
          hideConversationsButton: t("copilot.hideConversationsButton"),
        }}
        data-testid="CopilotPopup__120cc9"
      />
    </>
  );
};

export default Navigation;
