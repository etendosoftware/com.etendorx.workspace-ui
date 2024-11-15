export type TranslationKeys = {
  common: {
    etendo: string;
    cancel: string;
    confirm: string;
    register: string;
    save: string;
    edit: string;
    loading: string;
  };
  modal: {
    secondaryButtonLabel: string;
  };
  registerModal: {
    descriptionText: string;
  };
  table: {
    tooltips: {
      search: string;
      views: string;
      filter: string;
      columns: string;
      openSidebar: string;
      closeSidebar: string;
      details: string;
      refresh: string;
    };
    placeholders: {
      search: string;
    };
    labels: {
      noIdentifier: string;
      noTitle: string;
      noType: string;
      noRecord: string;
    };
    content: {
      currentTitle: string;
    };
  };
  navigation: {
    waterfall: {
      activateAll: string;
      deactivateAll: string;
      tooltipButton: string;
      buttons: string;
      customize: string;
    };
    configurationModal: {
      tooltipButtonProfile: string;
    };
    activityButton: {
      tooltip: string;
    };
    notificationModal: {
      title: string;
      markAllAsRead: string;
      emptyStateImageAlt: string;
      emptyStateMessage: string;
      emptyStateDescription: string;
      actionButtonLabel: string;
    };
    profile: {
      tooltipButtonProfile: string;
      passwordLabel: string;
      newPasswordLabel: string;
      confirmPasswordLabel: string;
      signOffTooltip: string;
      saveAsDefault: string;
    };
  };
};

export type Language = 'es' | 'en';

export type Translations = {
  [key in Language]: TranslationKeys;
};
