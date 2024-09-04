export type TranslationKeys = {
  common: {
    cancel: string;
    confirm: string;
    register: string;
    save: string;
    edit: string;
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
};

export type Language = 'es' | 'en';

export type Translations = {
  [key in Language]: TranslationKeys;
};
