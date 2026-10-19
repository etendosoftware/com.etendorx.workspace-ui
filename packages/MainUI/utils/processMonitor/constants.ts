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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/** AD window "Process Request" (Process Scheduling). */
export const PROCESS_REQUEST_WINDOW_ID = "48E7EDE7D1104A59B46FC7449D9FB267";

/** AD window "Process Monitor". */
export const PROCESS_MONITOR_WINDOW_ID = "EF3E837705944F4DBF398D683D36ACE0";

/** Delay between polls; doubled after each consecutive failure up to {@link POLL_MAX_BACKOFF_MS}. */
export const POLL_INTERVAL_MS = 10000;

/** Upper bound of the exponential backoff applied after consecutive failed polls. */
export const POLL_MAX_BACKOFF_MS = 60000;

/** Safety margin subtracted from the cursor: the backend compares strictly (updated > since). */
export const CURSOR_SAFETY_MARGIN_MS = 2000;

/** Executions fetched by the initial load (newest first). */
export const INITIAL_LIMIT = 50;

/** Page size of the incremental calls. */
export const INCREMENTAL_LIMIT = 200;

/** Max consecutive `hasMore` pages drained in a single poll, so a flood can never spin the loop. */
export const MAX_PAGES_PER_POLL = 5;

/** Executions kept in memory (running ones are never evicted). */
export const MAX_KEPT_EXECUTIONS = 200;
