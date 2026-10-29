import { type NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
import { carryErpLoginSessionId, getErpSessionCookie, setErpLoginSessionId } from "@/app/api/_utils/sessionStore";
import { extractBearerToken } from "@/lib/auth";
import { handOffErpSession, storeErpSession } from "../../_utils/erpSession";
import { joinUrl } from "../../_utils/url";
import { handleLoginError } from "../../_utils/sessionErrors";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function validateEnvironment(): void {
  if (!process.env.ETENDO_CLASSIC_URL) {
    console.error("ETENDO_CLASSIC_URL environment variable is not set");
    throw new Error("Server configuration error");
  }
}

async function fetchErpLogin(
  erpLoginUrl: string,
  body: any,
  cookieHeader?: string,
  userToken?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  if (userToken) {
    headers.Authorization = `Bearer ${userToken}`;
  }

  return fetch(erpLoginUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }).catch((fetchError) => {
    console.error("Fetch error - Etendo API not accessible:", fetchError);
    throw new Error("Etendo API is not accessible");
  });
}

// Raised by SecureWebServicesUtils.pickFallbackWarehouse when the selected organization has no
// warehouses at all. Classic tolerates that (the session's warehouse is simply left empty), but
// /sws/login does not. com.etendoerp.metadata's /meta/change-profile replicates Classic's
// tolerance, so it's used here purely as a fallback for this one error - every other role/org
// change keeps going through /sws/login, which also syncs the classic JSESSIONID that legacy
// features (attachments, notes, printing) rely on and the fallback endpoint does not.
const ORG_HAS_NO_WAREHOUSES_ERROR = "SMFSWS_OrgHasNoRole";
const HTTP_UNAUTHORIZED = 401;
const DEFAULT_LOGIN_ERROR = "Login failed";

async function fetchChangeProfileFallback(body: any, userToken?: string | null): Promise<Response> {
  const changeProfileUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, "/sws/com.etendoerp.metadata.meta/change-profile");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (userToken) {
    headers.Authorization = `Bearer ${userToken}`;
  }

  return fetch(changeProfileUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }).catch((fetchError) => {
    console.error("Fetch error - change-profile fallback not accessible:", fetchError);
    throw new Error("Etendo API is not accessible");
  });
}

// Same OrgHasNoWarehouses failure as above, but for the initial (username/password) login rather
// than a role switch on an already-authenticated session: there is no prior JWT to attach as a
// Bearer token here, so /meta/change-profile (which requires one) can't help. /meta/login
// authenticates independently via core's PasswordHash, so it works without any existing session.
async function fetchLoginFallback(body: any): Promise<Response> {
  const loginUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, "/sws/com.etendoerp.metadata.meta/login");

  return fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  }).catch((fetchError) => {
    console.error("Fetch error - login fallback not accessible:", fetchError);
    throw new Error("Etendo API is not accessible");
  });
}

async function tryFallbackLogin(body: any, userToken: string | null): Promise<any | null> {
  // Initial username/password login has no prior token to fall back with;
  // an in-session role switch does - route to whichever fallback can actually authenticate.
  const fallbackResponse =
    body?.username && body?.password
      ? await fetchLoginFallback(body)
      : await fetchChangeProfileFallback(body, userToken);

  if (!fallbackResponse.ok) {
    return null;
  }

  const fallbackData = await fallbackResponse.json().catch(() => null);
  return fallbackData?.token ? fallbackData : null;
}

async function handleErpErrorResponse(data: any, body: any, userToken: string | null): Promise<NextResponse> {
  if (data.message === ORG_HAS_NO_WAREHOUSES_ERROR) {
    const fallbackData = await tryFallbackLogin(body, userToken);
    if (fallbackData) {
      return await completeLogin(fallbackData, body, userToken);
    }
  }

  return NextResponse.json({ message: data.message || DEFAULT_LOGIN_ERROR }, { status: HTTP_UNAUTHORIZED });
}

// /sws/login does not follow the Classic rule when the request names no role: it takes the first
// entry of an unordered role list. Right after an initial login, com.etendoerp.metadata is asked
// for the Classic login defaults and, when the new token does not use them yet, the token is
// switched to them through the same /sws/login role switch the profile modal uses.
const LOGIN_DEFAULTS_PATH = "/sws/com.etendoerp.metadata.meta/login-defaults";
const ERP_LOGIN_PATH = "/sws/login";

interface LoginDefaults {
  role: string;
  organization: string;
  warehouse?: string;
  current: boolean;
}

interface LoginRequestBody {
  username?: string;
  password?: string;
  role?: string;
}

interface ErpLoginResponse {
  token?: string;
  message?: string;
  // AD_Session_ID, returned by the com.etendoerp.metadata login endpoints (not by /sws/login)
  sessionId?: string;
}

function isInitialLogin(body: LoginRequestBody | null): boolean {
  return Boolean(body?.username && body?.password && !body?.role);
}

async function fetchLoginDefaults(userToken: string): Promise<LoginDefaults | null> {
  const response = await fetch(joinUrl(process.env.ETENDO_CLASSIC_URL, LOGIN_DEFAULTS_PATH), {
    method: "GET",
    headers: { Accept: "application/json", Authorization: `Bearer ${userToken}` },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function buildProfileBody(defaults: LoginDefaults): Record<string, string> {
  const profile: Record<string, string> = { role: defaults.role, organization: defaults.organization };
  // Classic leaves the warehouse empty for an organization without one; /sws/login then picks its own
  if (defaults.warehouse) {
    profile.warehouse = defaults.warehouse;
  }
  return profile;
}

async function readJson(response: Response): Promise<ErpLoginResponse | null> {
  if (!response.ok) {
    return null;
  }

  return response.json();
}

function adoptSwitchedLogin(
  response: Response,
  data: ErpLoginResponse | null,
  userToken: string
): ErpLoginResponse | null {
  if (!data?.token) {
    return null;
  }

  handOffErpSession(response, data.token, userToken);
  return data;
}

async function switchToLoginDefaults(
  userToken: string,
  profile: Record<string, string>
): Promise<ErpLoginResponse | null> {
  const erpLoginUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, ERP_LOGIN_PATH);
  const cookieHeader = getErpSessionCookie(userToken) || undefined;
  const response = await fetchErpLogin(erpLoginUrl, profile, cookieHeader, userToken);
  const data = await readJson(response);

  if (data?.message === ORG_HAS_NO_WAREHOUSES_ERROR) {
    const fallbackResponse = await fetchChangeProfileFallback(profile, userToken);
    return adoptSwitchedLogin(fallbackResponse, await readJson(fallbackResponse), userToken);
  }

  return adoptSwitchedLogin(response, data, userToken);
}

/**
 * Switches a brand new login token to the user's Classic login defaults when it does not use them.
 * Best-effort: on any failure the original login is kept, so this can never block a login.
 *
 * @returns the switched login response, or null to keep the original one
 */
async function alignWithClassicDefaults(userToken: string): Promise<ErpLoginResponse | null> {
  try {
    const defaults = await fetchLoginDefaults(userToken);
    if (!defaults || defaults.current) {
      return null;
    }

    return await switchToLoginDefaults(userToken, buildProfileBody(defaults));
  } catch (error) {
    console.warn("Could not align the login with the Classic login defaults:", error);
    return null;
  }
}

// /sws/login (com.smf.securewebservices) only checks the password. The credentials are first sent
// to com.etendoerp.metadata, which applies the Classic protections: the answer is delayed by the
// previous failed attempts, a locked user is refused, and a failed attempt is recorded in the
// Classic session registry and may lock the user.
const LOGIN_GUARD_PATH = "/sws/com.etendoerp.metadata.meta/login-guard";
// /sws/login records no session either: the successful login is recorded once the final token exists
const LOGIN_SESSION_PATH = "/sws/com.etendoerp.metadata.meta/login-session";
function hasCredentials(body: LoginRequestBody | null): boolean {
  return Boolean(body?.username && body?.password);
}

function buildRefusal(data: { error?: string } | null): NextResponse {
  return NextResponse.json({ message: data?.error || DEFAULT_LOGIN_ERROR }, { status: HTTP_UNAUTHORIZED });
}

/**
 * Runs the Classic failed-attempt protections on the credentials.
 *
 * Only an explicit refusal stops the login. Any other failure (unreachable endpoint, older module)
 * lets it go on: /sws/login stays reachable on its own, so failing closed would add no protection
 * and would lock every user out on a version mismatch.
 *
 * @returns the refusal to send back, or null to go on with the login
 */
async function runLoginGuard(body: LoginRequestBody): Promise<NextResponse | null> {
  try {
    const guardUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, LOGIN_GUARD_PATH);
    const response = await fetchErpLogin(guardUrl, { username: body.username, password: body.password });
    if (response.status !== HTTP_UNAUTHORIZED) {
      return null;
    }

    return buildRefusal(await response.json().catch(() => null));
  } catch (error) {
    console.warn("Could not apply the login attempt protections:", error);
    return null;
  }
}

async function requestLoginSessionId(token: string): Promise<string | undefined> {
  const sessionUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, LOGIN_SESSION_PATH);
  const data = await readJson(await fetchErpLogin(sessionUrl, {}, undefined, token));
  return data?.sessionId;
}

/**
 * Remembers the Classic session registry id of a new login so the logout can close it. The metadata
 * login endpoints already recorded it; a /sws/login token gets it recorded here. Best-effort: a
 * failure never blocks the login.
 */
async function rememberLoginSession(login: ErpLoginResponse & { token: string }): Promise<void> {
  try {
    const sessionId = login.sessionId ?? (await requestLoginSessionId(login.token));
    setErpLoginSessionId(login.token, sessionId);
  } catch (error) {
    console.warn("Could not record the login session:", error);
  }
}

async function trackLoginSession(login: ErpLoginResponse, body: LoginRequestBody, userToken: string | null) {
  if (!login.token) {
    return;
  }

  if (hasCredentials(body)) {
    await rememberLoginSession({ ...login, token: login.token });
    return;
  }

  // A role switch keeps the login of the token it replaces
  if (userToken) {
    carryErpLoginSessionId(userToken, login.token);
  }
}

/**
 * Tracks the login session and answers with the login, without the session id: it stays on the
 * server, next to the rest of the ERP session material.
 */
async function completeLogin(
  login: ErpLoginResponse,
  body: LoginRequestBody,
  userToken: string | null
): Promise<NextResponse> {
  await trackLoginSession(login, body, userToken);
  const { sessionId: _sessionId, ...clientLogin } = login;
  return NextResponse.json(clientLogin, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    validateEnvironment();

    const body = await request.json();

    if (hasCredentials(body)) {
      const refusal = await runLoginGuard(body);
      if (refusal) {
        return refusal;
      }
    }
    const erpLoginUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, ERP_LOGIN_PATH);

    const userToken = extractBearerToken(request);
    // Forward the existing JSESSIONID (if any) so the backend can associate/invalidate the old session
    const existingCookie = userToken ? getErpSessionCookie(userToken) : null;
    const erpResponse = await fetchErpLogin(erpLoginUrl, body, existingCookie || undefined, userToken || undefined);

    if (!erpResponse || !erpResponse.ok) {
      throw new Error("ERP login failed", { cause: erpResponse });
    }

    const data = await erpResponse.json().catch((jsonError) => {
      throw new Error("Invalid response from Etendo Classic backend", { cause: jsonError });
    });

    if (data.status === "error") {
      return await handleErpErrorResponse(data, body, userToken);
    }

    storeErpSession(erpResponse, data.token);

    if (isInitialLogin(body)) {
      const aligned = await alignWithClassicDefaults(data.token);
      if (aligned) {
        return await completeLogin(aligned, body, userToken);
      }
    }

    if (!erpResponse.ok) {
      return NextResponse.json({ error: data.error || DEFAULT_LOGIN_ERROR }, { status: erpResponse.status });
    }
    return await completeLogin(data, body, userToken);
  } catch (error) {
    return handleLoginError(error);
  }
}
