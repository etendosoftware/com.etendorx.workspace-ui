import { useUserContext } from "../useUserContext";
import { useRuntimeConfig } from "../../contexts/RuntimeConfigContext";

const ABOUT_URL_ENDPOINT = "/ad_forms/about.html?IsPopUpCall=1";

export function useAboutModal() {
  const { token } = useUserContext();
  const { config } = useRuntimeConfig();

  const publicHost = config?.etendoClassicHost || "";

  // Point to Next.js API proxy to handle authentication/session validation
  const aboutUrl = `/api/erp${ABOUT_URL_ENDPOINT}&token=${token}`;

  return {
    aboutUrl,
  };
}

export default useAboutModal;
