export interface Translations {
  register: string;
  descriptionText: string;
  save: string;
  cancel: string;
  noIdentifier: string;
  noTitle: string;
}

export interface RegisterModalProps {
  registerText: string;
  translations: Translations;
}
