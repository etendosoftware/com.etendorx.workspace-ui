import { API_REFRESH_URL } from "./constants";
import { Metadata } from "./metadata";
import type { LoginResponse } from "./types";

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const result = await Metadata.loginClient.request("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!result.ok) {
      const errorMessage = result.data?.message || result.data?.error || `HTTP error! status: ${result.status}`;
      throw new Error(errorMessage);
    }

    const data = result.data;

    if (data.token) {
      return data;
    }
    throw new Error("Invalid");
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

/**
 * Renews the current session token before it expires.
 *
 * Goes through `loginClient`, which already carries the Authorization header and — unlike the other
 * clients — is not covered by the global 401 interceptor. That is intentional: a failed renewal must
 * not trigger an immediate logout, the expiry logic decides what happens next.
 *
 * @returns The response carrying the newly issued token
 */
export const refreshToken = async (): Promise<LoginResponse> => {
  const result = await Metadata.loginClient.request(API_REFRESH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!result.ok) {
    throw new Error(`Token refresh failed! status: ${result.status}`);
  }

  if (!result.data?.token) {
    throw new Error("Token refresh returned no token");
  }

  return result.data;
};

export const logout = async (): Promise<void> => {
  try {
    const result = await Metadata.loginClient.request("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!result.ok) {
      throw new Error(`HTTP error! status: ${result.status}`);
    }
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};
