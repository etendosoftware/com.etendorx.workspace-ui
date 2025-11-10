import { useUserContext } from "../useUserContext";

const ABOUT_URL_ENDPOINT = "/ad_forms/about.html?IsPopUpCall=1";

export function useAboutModal() {
  const { token } = useUserContext();

  const aboutUrl = `/api/erp/meta/legacy${ABOUT_URL_ENDPOINT}&token=${token}`;

  return {
    aboutUrl,
  };
}

export default useAboutModal;
