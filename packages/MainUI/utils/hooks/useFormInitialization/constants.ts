export const ACTION_FORM_INITIALIZATION = "org.openbravo.client.application.window.FormInitializationComponent";

/**
 * Form initialization modes
 */
export const MODE_CHANGE = "CHANGE";
export const MODE_NEW = "NEW";

/**
 * Status value the kernel returns inside the `{ response: { status } }` envelope
 * when a FormInitialization / callout execution fails (e.g. a callout throws on the
 * server while the HTTP status is still 200).
 */
export const FIC_ERROR_STATUS = -1;
