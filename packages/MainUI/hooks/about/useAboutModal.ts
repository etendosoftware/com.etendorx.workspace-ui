import { useUserContext } from "../useUserContext";
import { useApiContext } from "../useApiContext";
import { API_IFRAME_FORWARD_PATH } from "@workspaceui/api-client/src/api/constants";

const ABOUT_URL_ENDPOINT = "/ad_forms/about.html?IsPopUpCall=1";

export function useAboutModal() {
  const { token } = useUserContext();
  const API_BASE_URL = useApiContext();
  // Use public host for client-side URLs (accessible from browser)
  // Falls back to API_BASE_URL if not set (backward compatibility)
  const publicHost = process.env.NEXT_PUBLIC_ETENDO_CLASSIC_HOST || API_BASE_URL;

  const aboutUrl = `${publicHost}${API_IFRAME_FORWARD_PATH}${ABOUT_URL_ENDPOINT}&token=${token}`;

  return {
    aboutUrl,
  };
}

export default useAboutModal;
