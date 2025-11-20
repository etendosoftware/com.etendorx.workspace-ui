import { useUserContext } from "../useUserContext";
import { useRuntimeConfig } from "../useRuntimeConfig";
import { API_IFRAME_FORWARD_PATH } from "@workspaceui/api-client/src/api/constants";

const ABOUT_URL_ENDPOINT = "/ad_forms/about.html?IsPopUpCall=1";

export function useAboutModal() {
  const { token } = useUserContext();
  const { config, loading } = useRuntimeConfig();

  // Use ETENDO_CLASSIC_HOST for direct browser access to Tomcat
  // This is necessary in Docker hybrid mode where the browser needs to access
  // Tomcat directly (e.g., localhost:8080) instead of through the Next.js proxy
  const publicHost = config?.etendoClassicHost || "";
  const aboutUrl = publicHost ? `${publicHost}${API_IFRAME_FORWARD_PATH}${ABOUT_URL_ENDPOINT}&token=${token}` : "";

  return {
    aboutUrl,
    loading,
  };
}

export default useAboutModal;
