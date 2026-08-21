export const DEFAULT_CSRF_TOKEN_ERROR = "InvalidCSRFToken";
export const DEFAULT_ACCESS_TABLE_NO_VIEW_ERROR = "AccessTableNoView";
/** Error code the metadata module returns when the caller must change an expired password. */
export const DEFAULT_PASSWORD_EXPIRED_ERROR = "PasswordExpired";
/**
 * Header the ERP proxy adds so the client interceptor can tell a specific backend rejection apart
 * without reading the response body — it runs before the body is parsed.
 */
export const ERP_ERROR_CODE_HEADER = "X-Etendo-Error-Code";

// CSRF Recovery Configuration
export const CSRF_RECOVERY_ENABLED_DEFAULT = true;
export const CSRF_MAX_RETRY_ATTEMPTS = 1;
