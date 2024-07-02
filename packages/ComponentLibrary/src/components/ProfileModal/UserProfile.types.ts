export interface User {
  photoUrl: string;
  name: string;
  email: string;
}

export interface ProfileModalProps {
  cancelButtonText?: string;
  saveButtonText?: string;
  tooltipModal?: string;
  passwordLabel?: string;
  newPasswordLabel?: string;
  confirmPasswordLabel?: string;
}
