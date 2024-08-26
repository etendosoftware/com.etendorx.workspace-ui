export interface ILogger {
  debug(...data: unknown[]): void;
  info(...data: unknown[]): void;
  log(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
}

export class Logger implements ILogger {
  private implementation: ILogger;

  constructor(implementation: ILogger) {
    this.implementation = implementation;
  }

  public debug(...data: unknown[]) {
    this.implementation.debug(...data);
  }
  public info(...data: unknown[]) {
    this.implementation.info(...data);
  }
  public log(...data: unknown[]) {
    this.implementation.log(...data);
  }
  public warn(...data: unknown[]) {
    this.implementation.warn(...data);
  }
  public error(...data: unknown[]) {
    this.implementation.error(...data);
  }
}

export const logger = new Logger(console);
