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

import { toast } from "sonner";
import { HTTP_CODES } from "@workspaceui/api-client/src/api/constants";
import { isWindowAccessDeniedError } from "@workspaceui/api-client/src/api/errors";
import { DEFAULT_ACCESS_TABLE_NO_VIEW_ERROR } from "@/utils/session/constants";
import type { TranslateFunction } from "@/hooks/types";

/** Texts of the toast shown when some windows of a deep-link could not be opened. */
export interface AccessDeniedToastTexts {
  title: string;
  descriptionOne: string;
  descriptionMany: string;
}

export interface ReportWindowsAccessDeniedParams {
  /** How many windows were discarded because the role has no access to them. */
  deniedCount: number;
  /** How many windows are still open after the discards. */
  remainingWindowCount: number;
  texts: AccessDeniedToastTexts;
  /** Store setter that switches the page over to the full-screen Access Denied view. */
  showAccessDeniedScreen: (count: number) => void;
}

/**
 * Shape of the datasource failures raised by `useDatasource`, which throws the raw response body
 * instead of an `Error`. Two variants exist: the direct proxy response and the cached wrapper.
 */
interface DatasourceErrorShape {
  __error?: boolean;
  status?: number;
  response?: { error?: { message?: string } };
  body?: { response?: { error?: { message?: string } } };
}

const asDatasourceError = (error: unknown): DatasourceErrorShape | undefined => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  return error as DatasourceErrorShape;
};

const extractDatasourceErrorMessage = (error: unknown): string | undefined => {
  const candidate = asDatasourceError(error);
  if (!candidate) {
    return undefined;
  }
  return candidate.response?.error?.message ?? candidate.body?.response?.error?.message;
};

/** Requires the `__error` marker so any unrelated object carrying a `status` is not a false hit. */
const isUnauthorizedDatasourceError = (error: unknown): boolean => {
  const candidate = asDatasourceError(error);
  if (!candidate) {
    return false;
  }
  return candidate.__error === true && candidate.status === HTTP_CODES.UNAUTHORIZED;
};

/**
 * Tells apart a permission failure from any other error, covering both the window metadata path
 * (typed error) and the datasource path (`AccessTableNoView` or a 401 wrapper).
 */
export const isAccessDeniedError = (error: unknown): boolean => {
  if (isWindowAccessDeniedError(error)) {
    return true;
  }
  if (extractDatasourceErrorMessage(error) === DEFAULT_ACCESS_TABLE_NO_VIEW_ERROR) {
    return true;
  }
  if (error instanceof Error && error.message === DEFAULT_ACCESS_TABLE_NO_VIEW_ERROR) {
    return true;
  }
  return isUnauthorizedDatasourceError(error);
};

/** Collects the toast labels once so callers do not duplicate the translation keys. */
export const buildAccessDeniedToastTexts = (t: TranslateFunction): AccessDeniedToastTexts => ({
  title: t("errors.accessDenied.discarded.title"),
  descriptionOne: t("errors.accessDenied.discarded.descriptionOne"),
  descriptionMany: t("errors.accessDenied.discarded.descriptionMany"),
});

/**
 * Builds the toast description. `useTranslation` does not interpolate parameters, so the singular
 * has its own sentence and the plural is prefixed with the count.
 */
export const buildAccessDeniedToastDescription = (count: number, texts: AccessDeniedToastTexts): string => {
  if (count === 1) {
    return texts.descriptionOne;
  }
  return `${count} ${texts.descriptionMany}`;
};

/**
 * Reports the windows that could not be opened: a toast when other windows survived, or the
 * full-screen Access Denied view when none did.
 */
export const reportWindowsAccessDenied = ({
  deniedCount,
  remainingWindowCount,
  texts,
  showAccessDeniedScreen,
}: ReportWindowsAccessDeniedParams): void => {
  if (deniedCount <= 0) {
    return;
  }
  if (remainingWindowCount > 0) {
    toast.warning(texts.title, { description: buildAccessDeniedToastDescription(deniedCount, texts) });
    return;
  }
  showAccessDeniedScreen(deniedCount);
};
