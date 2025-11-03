import { useUserContext } from "../useUserContext";

const ABOUT_URL_ENDPOINT = "/ad_forms/about.html?IsPopUpCall=1";

export function useAboutModal() {
  const { token } = useUserContext();

  // Route through Next.js API to ensure proper charset handling
  const aboutUrl = `/api/erp/meta/legacy${ABOUT_URL_ENDPOINT}&token=${token}`;

  return {
    aboutUrl,
  };
}

export default useAboutModal;
