interface BasicAuthConfig {
  username: string;
  password: string;
}
//TODO: Improve this to not expose the enviroments variables
export class BasicAuthHelper {
  private static instance: BasicAuthHelper;
  private credentials: string;

  private constructor() {
    if (typeof window !== 'undefined') {
      const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USERNAME;
      const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASSWORD;

      if (!username || !password) {
        throw new Error('Basic auth credentials not configured in client environment');
      }

      this.credentials = this.generateAuthHeader(username, password);
    } else {
      const username = process.env.BASIC_AUTH_USERNAME;
      const password = process.env.BASIC_AUTH_PASSWORD;

      if (!username || !password) {
        throw new Error('Basic auth credentials not configured in server environment');
      }

      this.credentials = this.generateAuthHeader(username, password);
    }
  }

  public static getInstance(): BasicAuthHelper {
    if (!BasicAuthHelper.instance) {
      BasicAuthHelper.instance = new BasicAuthHelper();
    }
    return BasicAuthHelper.instance;
  }

  private generateAuthHeader(username: string, password: string): string {
    return btoa(`${username}:${password}`);
  }

  public getAuthHeader(): string {
    return `Basic ${this.credentials}`;
  }

  public static createHeaders(additionalHeaders: Record<string, string> = {}): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: BasicAuthHelper.getInstance().getAuthHeader(),
      ...additionalHeaders,
    };
  }
}
