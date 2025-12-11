import { useUserContext } from "../useUserContext";
import { useRuntimeConfig } from "../../contexts/RuntimeConfigContext";

const ABOUT_URL_ENDPOINT = "/ad_forms/about.html?IsPopUpCall=1";

export function useAboutModal() {
  const { token } = useUserContext();
  const { config } = useRuntimeConfig();

  const publicHost = config?.etendoClassicHost || "";

  // Point directly to classic URL to avoid unnecessary routing through Next.js
  const aboutUrl = publicHost ? `${publicHost}${ABOUT_URL_ENDPOINT}&token=${token}` : "";

  return {
    aboutUrl,
  };
}

export default useAboutModal;
