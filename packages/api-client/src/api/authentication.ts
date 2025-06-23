import { API_LOGIN_URL } from "./constants";
import { Metadata } from "./metadata";
import type { LoginResponse } from "./types";

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const result = await Metadata.loginClient.request(API_LOGIN_URL, {
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
