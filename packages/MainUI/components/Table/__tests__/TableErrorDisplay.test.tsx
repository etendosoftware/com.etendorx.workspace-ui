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

import { fireEvent, render, screen } from "@testing-library/react";
import { TableErrorDisplay } from "@/components/Table/TableErrorDisplay";
import { DEFAULT_ACCESS_TABLE_NO_VIEW_ERROR } from "@/utils/session/constants";

const ACCESS_DENIED_TESTID = "AccessDeniedDisplay";
const ERROR_DISPLAY_TESTID = "ErrorDisplay";
const RETRY_LABEL = "Retry";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/components/AccessDeniedDisplay", () => ({
  AccessDeniedDisplay: ({ description }: any) => <div data-testid="AccessDeniedDisplay">{description}</div>,
}));

jest.mock("@/components/ErrorDisplay", () => ({
  ErrorDisplay: ({ title, description, onRetry }: any) => (
    <div data-testid="ErrorDisplay">
      <h2>{title}</h2>
      <p>{description}</p>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  ),
}));

describe("TableErrorDisplay", () => {
  it("shows the permission message for a datasource access failure", () => {
    const error = { response: { error: { message: DEFAULT_ACCESS_TABLE_NO_VIEW_ERROR } } };

    render(<TableErrorDisplay error={error} onRetry={jest.fn()} />);

    expect(screen.getByTestId(ACCESS_DENIED_TESTID)).toHaveTextContent("errors.accessDenied.tableDescription");
    expect(screen.queryByTestId(ERROR_DISPLAY_TESTID)).not.toBeInTheDocument();
  });

  it("keeps the generic retryable error for any other failure", () => {
    render(<TableErrorDisplay error={new Error("boom")} onRetry={jest.fn()} />);

    expect(screen.getByTestId(ERROR_DISPLAY_TESTID)).toBeInTheDocument();
    expect(screen.getByText("errors.tableError.title")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("forwards the retry action of the generic error", () => {
    const onRetry = jest.fn();
    render(<TableErrorDisplay error={new Error("boom")} onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: RETRY_LABEL }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("tolerates a raw thrown object with no message", () => {
    render(<TableErrorDisplay error={{ response: { data: [] } }} onRetry={jest.fn()} />);

    expect(screen.getByTestId(ERROR_DISPLAY_TESTID)).toBeInTheDocument();
    expect(screen.getByText("errors.tableError.title")).toBeInTheDocument();
  });
});
