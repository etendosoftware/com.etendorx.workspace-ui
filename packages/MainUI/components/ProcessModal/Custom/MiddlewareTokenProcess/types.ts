/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

/**
 * @fileoverview Types for the Get Middleware Token chooser.
 *
 * The schema is produced by the process `em_etmeta_onload`, which calls
 * `com.etendoerp.metadata.SSOProviderListActionHandler` and passes its answer straight through.
 * `providers` keeps the middleware's own shape (keyed by provider id) so the transport stays a
 * verbatim relay and only this component interprets it.
 */

export interface MiddlewareScope {
  /** Human-readable scope name, shown under the button. */
  name?: string;
  /** The OAuth scope URL requested from the provider. */
  scope?: string;
  /** Longer explanation, shown as the button tooltip. */
  description?: string;
  /**
   * Icon URL published by the middleware. Deliberately unused: it points at a third-party host
   * (img.icons8.com) that can fail or be blocked. Kept in the type so the shape stays honest about
   * what the service sends.
   */
  iconUrl?: string;
}

export interface MiddlewareProvider {
  name?: string;
  scopes?: MiddlewareScope[];
}

export interface MiddlewareTokenSchema {
  /** Discriminator; selects this component through the custom-component registry. */
  type: "middlewareTokenProcess";
  /** Provider catalogue as published by the middleware, keyed by provider id (e.g. "google"). */
  providers: Record<string, MiddlewareProvider>;
  /** Instance System Identifier, sent to the middleware as `account_id`. */
  accountId: string;
  /** Redirect URI configured on the OAuth Provider record. */
  redirectUri: string;
  /** Authorization endpoint of the OAuth Provider record, with `/start` already appended. */
  startEndpoint: string;
  /**
   * Set when the onLoad could not build the catalogue: a stable code the component maps to
   * translated text. Carried inside the schema rather than raised, because a failing onLoad leaves
   * the modal rendering an empty standard dialog with nothing to show the user.
   */
  errorCode?: string;
  /** English diagnostic that accompanies `errorCode`, for logs and support — never displayed. */
  errorMessage?: string;
}

/** One scope button, flattened out of the nested provider/scope structure for rendering. */
export interface ScopeChoice {
  providerId: string;
  providerLabel: string;
  scope: string;
  label: string;
  description: string;
}
