interface LoginResponse {
  token: string;
}

interface LoginCredentials {
  username: string;
  password: string;
  role: string;
}

export class AuthService {
  private static token: string | null = null;

  static async login(credentials: LoginCredentials): Promise<string> {
    try {
      const loginUrl = "http://localhost:8080/etendo/sws/login";
      console.log("[AuthService] Login URL:", window.location.origin + loginUrl);
      console.log("[AuthService] Login credentials:", { username: credentials.username, role: credentials.role });

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      console.log("[AuthService] Login response status:", response.status);

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data: LoginResponse = await response.json();
      this.token = data.token;
      return data.token;
    } catch (error) {
      console.error("Auth error:", error);
      throw error;
    }
  }

  static async autoLogin(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    // Auto-login with default credentials
    return this.login({
      username: "admin",
      password: "admin",
      role: "0",
    });
  }

  static getToken(): string | null {
    return this.token;
  }

  static setToken(token: string): void {
    this.token = token;
  }

  static clearToken(): void {
    this.token = null;
  }
}
