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

import { fireEvent, render, screen } from "@testing-library/react";
import { ErrorRecoveryScreen } from "../ErrorRecoveryScreen";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const loggerError = jest.fn();
jest.mock("@/utils/logger", () => ({
  logger: { error: (...a: unknown[]) => loggerError(...a), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

describe("ErrorRecoveryScreen", () => {
  beforeEach(() => loggerError.mockClear());

  it("shows the recovery UI instead of a blank screen", () => {
    render(<ErrorRecoveryScreen error={new Error("boom")} reset={jest.fn()} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("errors.boundary.title")).toBeInTheDocument();
    expect(screen.getByText("errors.boundary.description")).toBeInTheDocument();
  });

  it("lets the user retry the failed subtree", () => {
    const reset = jest.fn();
    render(<ErrorRecoveryScreen error={new Error("boom")} reset={reset} />);

    fireEvent.click(screen.getByText("errors.internalServerError.retry"));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("offers only a full reload when the failure cannot be retried in place", () => {
    render(<ErrorRecoveryScreen error={new Error("boom")} />);

    expect(screen.queryByText("errors.internalServerError.retry")).not.toBeInTheDocument();
    expect(screen.getByText("errors.boundary.reload")).toBeInTheDocument();
  });

  it("shows the error digest as a support reference", () => {
    render(<ErrorRecoveryScreen error={Object.assign(new Error("boom"), { digest: "abc123" })} />);

    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  it("logs the error", () => {
    render(<ErrorRecoveryScreen error={new Error("boom")} />);

    expect(loggerError).toHaveBeenCalledWith("Unhandled render error", expect.objectContaining({ message: "boom" }));
  });
});
