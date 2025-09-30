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
      throw new Error(`HTTP error! status: ${result.status}`);
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
