import { API_IFRAME_FORWARD_PATH } from "@workspaceui/api-client/src/api/constants";
import { useUserContext } from "../useUserContext";
import { useApiContext } from "../useApiContext";

const ABOUT_URL_ENDPOINT = "/ad_forms/about.html?IsPopUpCall=1";

export function useAboutModal() {
  const API_BASE_URL = useApiContext();
  const { token } = useUserContext();

  const aboutUrl = `${API_BASE_URL}${API_IFRAME_FORWARD_PATH}${ABOUT_URL_ENDPOINT}&token=${token}`;

  return {
    aboutUrl,
  };
}

export default useAboutModal;
