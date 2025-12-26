import { useUserContext } from "../useUserContext";

const ABOUT_URL_ENDPOINT = "/ad_forms/about.html?IsPopUpCall=1";

export function useAboutModal() {
  const { token } = useUserContext();

  // Point to Next.js API proxy to handle authentication/session validation
  const aboutUrl = `/api/erp${ABOUT_URL_ENDPOINT}&token=${token}`;

  return {
    aboutUrl,
  };
}

export default useAboutModal;
