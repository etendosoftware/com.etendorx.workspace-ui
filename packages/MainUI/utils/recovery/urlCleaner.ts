import {
  removeRecoveryParameters,
  removeWindowParameters,
  parseWindowRecoveryData,
  validateRecoveryParameters,
} from "@/utils/url/utils";

/**
 * Cleans up URL after successful recovery
 */
export const cleanupUrl = (): void => {
  try {
    const currentUrl = new URL(window.location.href);
    const searchParams = new URLSearchParams(currentUrl.search);

    // Remove all recovery parameters
    const cleanParams = removeRecoveryParameters(searchParams);

    // Build clean URL
    const baseUrl = `${currentUrl.origin}${currentUrl.pathname}`;
    const newUrl = cleanParams.toString() ? `${baseUrl}?${cleanParams.toString()}` : baseUrl;

    // Replace current URL state
    window.history.replaceState(null, "", newUrl);
  } catch (error) {
    console.error("Error during URL cleanup:", error);
  }
};

/**
 * Removes parameters for specific window that failed recovery
 */
export const cleanupFailedWindowUrl = (windowIndex: number): void => {
  try {
    const currentUrl = new URL(window.location.href);
    const searchParams = new URLSearchParams(currentUrl.search);

    // Remove parameters for the specific window
    const cleanParams = removeWindowParameters(searchParams, windowIndex);

    // Build clean URL
    const baseUrl = `${currentUrl.origin}${currentUrl.pathname}`;
    const newUrl = cleanParams.toString() ? `${baseUrl}?${cleanParams.toString()}` : baseUrl;

    // Replace current URL state
    window.history.replaceState(null, "", newUrl);
  } catch (error) {
    console.error("Error during failed window URL cleanup:", error);
  }
};

/**
 * Cleans invalid recovery parameters from URL
 */
export const cleanInvalidParameters = (): void => {
  try {
    const currentUrl = new URL(window.location.href);
    const searchParams = new URLSearchParams(currentUrl.search);

    // Parse recovery data to identify invalid parameters
    const recoveryData = parseWindowRecoveryData(searchParams);
    const cleanParams = new URLSearchParams(searchParams);
    let hasInvalidParams = false;

    recoveryData.forEach((info, index) => {
      // Check if parameters are consistent (both tabId and recordId present, or neither)
      if (!validateRecoveryParameters(info)) {
        // Remove inconsistent parameters for this window
        cleanParams.delete(`ti_${index}`);
        cleanParams.delete(`ri_${index}`);
        hasInvalidParams = true;

        console.warn(`Removed invalid recovery parameters for window index ${index}:`, {
          windowIdentifier: info.windowIdentifier,
          tabId: info.tabId,
          recordId: info.recordId,
        });
      }
    });

    // Update URL only if invalid parameters were found
    if (hasInvalidParams) {
      const baseUrl = `${currentUrl.origin}${currentUrl.pathname}`;
      const newUrl = cleanParams.toString() ? `${baseUrl}?${cleanParams.toString()}` : baseUrl;

      window.history.replaceState(null, "", newUrl);
      console.log("Cleaned invalid recovery parameters from URL");
    }
  } catch (error) {
    console.error("Error cleaning invalid parameters:", error);
  }
};
