import { removeRecoveryParameters } from "@/utils/url/utils";
import type { WindowRecoveryInfo } from "@/utils/window/constants";

export enum RecoveryErrorType {
  ENDPOINT_FAILURE = "ENDPOINT_FAILURE",
  INVALID_PARAMETERS = "INVALID_PARAMETERS",
  NETWORK_ERROR = "NETWORK_ERROR",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  DATA_NOT_FOUND = "DATA_NOT_FOUND",
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}

export interface RecoveryError {
  type: RecoveryErrorType;
  message: string;
  originalError?: Error;
  recoveryInfo: WindowRecoveryInfo;
}

/**
 * Handles recovery errors and determines appropriate fallback action
 */
export const handleRecoveryError = async (
  error: unknown,
  recoveryInfo: WindowRecoveryInfo
): Promise<string> => {

  const recoveryError = classifyError(error, recoveryInfo);

  // Log error for debugging
  console.error("Recovery error:", recoveryError);

  // Clean URL parameters on error
  await cleanUrlOnError(recoveryError);

  // Return user-friendly error message
  return getUserFriendlyErrorMessage(recoveryError);
};

/**
 * Classifies the error type for appropriate handling
 */
const classifyError = (error: unknown, recoveryInfo: WindowRecoveryInfo): RecoveryError => {
  const baseError = {
    originalError: error instanceof Error ? error : undefined,
    recoveryInfo
  };

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return {
        ...baseError,
        type: RecoveryErrorType.NETWORK_ERROR,
        message: "Network error during recovery"
      };
    }

    if (message.includes("not found") || message.includes("404")) {
      return {
        ...baseError,
        type: RecoveryErrorType.DATA_NOT_FOUND,
        message: "Requested data no longer exists"
      };
    }

    if (message.includes("unauthorized") || message.includes("403")) {
      return {
        ...baseError,
        type: RecoveryErrorType.PERMISSION_DENIED,
        message: "Insufficient permissions for recovery"
      };
    }

    if (message.includes("invalid") || message.includes("parameter")) {
      return {
        ...baseError,
        type: RecoveryErrorType.INVALID_PARAMETERS,
        message: "Invalid recovery parameters"
      };
    }

    return {
      ...baseError,
      type: RecoveryErrorType.ENDPOINT_FAILURE,
      message: error.message
    };
  }

  return {
    ...baseError,
    type: RecoveryErrorType.UNKNOWN_ERROR,
    message: "Unknown error during recovery"
  };
};

/**
 * Cleans URL parameters when recovery fails
 */
const cleanUrlOnError = async (recoveryError: RecoveryError): Promise<void> => {
  try {
    const currentUrl = new URL(window.location.href);
    const searchParams = new URLSearchParams(currentUrl.search);

    // Remove all recovery parameters on error
    const cleanParams = removeRecoveryParameters(searchParams);

    // Update URL without recovery parameters
    const newUrl = `${currentUrl.pathname}${cleanParams.toString() ? `?${cleanParams.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);

  } catch (error) {
    console.error("Error cleaning URL after recovery failure:", error);
  }
};

/**
 * Returns user-friendly error messages based on error type
 */
const getUserFriendlyErrorMessage = (recoveryError: RecoveryError): string => {
  switch (recoveryError.type) {
    case RecoveryErrorType.NETWORK_ERROR:
      return "Unable to restore window state due to connection issues. Please check your network and try again.";

    case RecoveryErrorType.DATA_NOT_FOUND:
      return "The requested data is no longer available. Window opened in default state.";

    case RecoveryErrorType.PERMISSION_DENIED:
      return "You don't have permission to access the requested data. Window opened in default state.";

    case RecoveryErrorType.INVALID_PARAMETERS:
      return "Invalid URL parameters detected. Window opened in default state.";

    case RecoveryErrorType.ENDPOINT_FAILURE:
      return "Unable to restore window state due to server error. Window opened in default state.";

    default:
      return "Unable to restore window state. Window opened in default state.";
  }
};

/**
 * Determines if recovery should be retried based on error type
 */
export const shouldRetryRecovery = (error: RecoveryError): boolean => {
  return error.type === RecoveryErrorType.NETWORK_ERROR;
};

/**
 * Gets retry delay in milliseconds based on error type
 */
export const getRetryDelay = (error: RecoveryError, attemptNumber: number): number => {
  if (error.type === RecoveryErrorType.NETWORK_ERROR) {
    return Math.min(1000 * Math.pow(2, attemptNumber), 10000); // Exponential backoff up to 10s
  }
  return 0;
};