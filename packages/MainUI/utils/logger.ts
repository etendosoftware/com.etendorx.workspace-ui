/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

export interface ILogger {
  debug(...data: unknown[]): void;
  info(...data: unknown[]): void;
  log(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
}

export class Logger implements ILogger {
  private implementation: ILogger;
  private enableDebugLogs: boolean;

  constructor(implementation: ILogger) {
    this.implementation = implementation;
    // Disable debug logs by default for performance
    // Set to true only when actively debugging
    this.enableDebugLogs = false;
  }

  public debug(...data: unknown[]) {
    if (this.enableDebugLogs) {
      this.implementation.debug(...data);
    }
  }
  public info(...data: unknown[]) {
    if (this.enableDebugLogs) {
      this.implementation.info(...data);
    }
  }
  public log(...data: unknown[]) {
    if (this.enableDebugLogs) {
      this.implementation.log(...data);
    }
  }
  public warn(...data: unknown[]) {
    // Keep warnings enabled
    this.implementation.warn(...data);
  }
  public error(...data: unknown[]) {
    // Keep errors enabled
    this.implementation.error(...data);
  }
}

export const logger = new Logger(console);
