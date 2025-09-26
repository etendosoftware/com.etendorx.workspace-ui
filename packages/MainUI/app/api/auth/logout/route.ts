export const runtime = "nodejs";
import { handleLoginError } from "../../_utils/sessionErrors";
import { clearAllErpSessions } from "../../_utils/sessionStore";

export async function POST() {
  try {
    clearAllErpSessions();
  } catch (error) {
    return handleLoginError(error);
  }
}
