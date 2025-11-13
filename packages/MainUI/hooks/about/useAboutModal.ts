import { useUserContext } from "../useUserContext";

const ABOUT_URL_ENDPOINT = "/ad_forms/about.html?IsPopUpCall=1";

export function useAboutModal() {
  const { token } = useUserContext();

  // Route through Next.js API proxy to ensure proper charset handling for HTML/CSS/JS resources
  // This uses the /api/erp/[...slug] proxy with the LEGACY slug category (meta/legacy)
  const aboutUrl = `/api/erp/meta/legacy${ABOUT_URL_ENDPOINT}&token=${token}`;

  return {
    aboutUrl,
  };
}

export default useAboutModal;
