import { ApiContext } from "@/contexts/api";
import { useContext } from "react";
import { API_FORWARD_PATH } from "@workspaceui/api-client/src/api/constants";

const ABOUT_URL_ENDPOINT = "/ad_forms/about.html?IsPopUpCall=1";
import { useUserContext } from "../useUserContext";

export function useAboutModal() {
  const apiUrl = useContext(ApiContext);
  const { token } = useUserContext();

  const aboutUrl = `${apiUrl}${API_FORWARD_PATH}${ABOUT_URL_ENDPOINT}&token=${token}`;

  return {
    aboutUrl,
  };
}

export default useAboutModal;
