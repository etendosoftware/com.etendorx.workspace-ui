"use client";

import { useLanguage } from "@/contexts/language";
import type { Language } from "@/contexts/types";
import { UserContext } from "@/contexts/user";
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
} from "@workspaceui/componentlibrary/src/components";
import type { Item } from "@workspaceui/componentlibrary/src/components/DragModal/DragModal.types";
import Nav from "@workspaceui/componentlibrary/src/components/Nav/Nav";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { NOTIFICATIONS, menuItems, sections } from "../../storybook/src/mocks";
import { useTranslation } from "../hooks/useTranslation";
import ProfileModal from "./ProfileModal/ProfileModal";
import { useAssistants } from "@/hooks/useAssistants";
import { useCopilotLabels } from "@/hooks/useCopilotLabels";
import { useCopilot } from "@/hooks/useCopilot";
import { buildContextString } from "@/utils/contextUtils";
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
    changeProfile,
    roles,
    languages,
  } = useContext(UserContext);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const { language, setLanguage, getFlag } = useLanguage();
  const [anchorEl] = useState<HTMLElement | null>(null);

  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotExpanded, setCopilotExpanded] = useState(false);
  const [pendingContextString, setPendingContextString] = useState<string | null>(null);
  const [pendingContextItems, setPendingContextItems] = useState<any[]>([]);

  const { assistants, getAssistants } = useAssistants();
  const { labels, getLabels } = useCopilotLabels();

  const { clearUserData } = useContext(UserContext);

  const handleSignOff = useCallback(() => {
    clearUserData();
  }, [clearUserData]);

  const handleSaveAsDefaultChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSaveAsDefault(event.target.checked);
  }, []);

  const handleCopilotOpen = useCallback(() => {
    setCopilotOpen(true);
  }, []);

  const handleCopilotOpenWithContext = useCallback((contextString: string, contextItems: any[]) => {
    setPendingContextString(contextString);
    setPendingContextItems(contextItems);
    setCopilotOpen(true);
  }, []);

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

  const { messages, selectedAssistant, isLoading, handleSendMessage, handleSelectAssistant, handleResetConversation } =
    useCopilot();

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
    getAssistants();
  }, [getLabels, getAssistants]);

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
      <Nav title={t("common.notImplemented")}>
        <Waterfall
          menuItems={menuItems}
          backButtonText={t("modal.secondaryButtonLabel")}
          activateAllText={t("navigation.waterfall.activateAll")}
          deactivateAllText={t("navigation.waterfall.deactivateAll")}
          tooltipWaterfallButton={t("navigation.waterfall.tooltipButton")}
          buttonText={t("navigation.waterfall.buttons")}
          customizeText={t("navigation.waterfall.customize")}
          items={item}
          icon={<AddIcon />}
          setItems={() => {}}
        />
        <ConfigurationSection />
        <CopilotButton onClick={handleCopilotOpen} tooltip="Copilot" />
        <NotificationButton notifications={NOTIFICATIONS} icon={<NotificationIcon />}>
          <NotificationModal
            notifications={NOTIFICATIONS}
            anchorEl={anchorEl}
            onClose={handleClose}
            title={{
              icon: <NotificationIcon fill="#2E365C" />,
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
          />
        </NotificationButton>
        <ProfileModal
          icon={<PersonIcon />}
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
          onSignOff={handleSignOff}
          languages={languagesWithFlags}
          userName={profile.name}
          userEmail={profile.email}
          userPhotoUrl={profile.image}
        />
      </Nav>
      <CopilotPopup
        open={copilotOpen}
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
        hasContextPending={!!pendingContextString}
        contextItems={pendingContextItems}
        onRemoveContext={handleRemoveContext}
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
          },
        }}
      />
    </>
  );
};

export default Navigation;
