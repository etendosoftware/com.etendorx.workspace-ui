interface BasicAuthConfig {
  username: string;
  password: string;
}
//TODO: Improve this to not expose the enviroments variables
export class BasicAuthHelper {
  private static instance: BasicAuthHelper;
  private credentials: string;

  private constructor() {
    const username = process.env.NEXT_PUBLIC_BASIC_AUTH_USERNAME;
    const password = process.env.NEXT_PUBLIC_BASIC_AUTH_PASSWORD;

    if (!username || !password) {
      //TODO: Improve this for production
      console.warn('Using default credentials');
      this.credentials = btoa('admin:admin');
    } else {
      this.credentials = btoa(`${username}:${password}`);
    }
  }

  public static getInstance(): BasicAuthHelper {
    if (!BasicAuthHelper.instance) {
      BasicAuthHelper.instance = new BasicAuthHelper();
    }
    return BasicAuthHelper.instance;
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
