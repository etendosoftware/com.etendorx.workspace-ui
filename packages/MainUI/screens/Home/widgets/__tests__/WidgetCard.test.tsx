/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance
 * with the License.
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

import { act, fireEvent, render, screen } from "@testing-library/react";
import type { WidgetDataResponse, WidgetInstance } from "@workspaceui/api-client/src/api/dashboard";
import WidgetCard from "@/screens/Home/widgets/WidgetCard";
import { logger } from "@/utils/logger";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockRendererMount = jest.fn();

jest.mock("@/screens/Home/widgets/WidgetRenderer", () => {
  const { useEffect } = jest.requireActual("react");
  return function MockWidgetRenderer({ data }: { data: { value: string } }) {
    useEffect(() => {
      mockRendererMount();
    }, []);
    return <span data-testid="MockWidgetRenderer">{data.value}</span>;
  };
});

const INSTANCE_ID = "w1";
const REFRESH_TEST_ID = `WidgetCard__refresh_${INSTANCE_ID}`;
const BODY_TEST_ID = `WidgetCard__body_${INSTANCE_ID}`;

const instance = {
  instanceId: INSTANCE_ID,
  widgetClassId: "kpi",
  layer: "USER",
  position: { col: 0, row: 0, width: 4, height: 2 },
  seqno: 10,
  parameters: {},
  name: "kpi",
  type: "KPI",
  title: "My widget",
  refreshInterval: 0,
} as WidgetInstance;

const makeData = (value: string) => ({ type: "KPI", data: { value }, meta: {} }) as unknown as WidgetDataResponse;

type CardProps = Partial<React.ComponentProps<typeof WidgetCard>>;

const renderCard = (props: CardProps = {}) => {
  const allProps = {
    instance,
    data: makeData("old"),
    error: undefined,
    onRemove: jest.fn(),
    onFetchPage: jest.fn(),
    ...props,
  };
  const view = render(<WidgetCard {...allProps} />);
  const rerender = (next: CardProps) => view.rerender(<WidgetCard {...allProps} {...next} />);
  return { ...view, rerender };
};

/** Returns a promise plus its resolve/reject handles, to control the refresh lifecycle. */
const deferred = () => {
  let resolve!: () => void;
  let reject!: (err: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const clickRefresh = () => fireEvent.click(screen.getByTestId(REFRESH_TEST_ID));

const expectIdle = () => {
  const button = screen.getByTestId(REFRESH_TEST_ID);
  expect(button).not.toBeDisabled();
  expect(button.firstElementChild).not.toHaveClass("animate-spin");
  expect(screen.getByTestId(BODY_TEST_ID)).not.toHaveClass("opacity-50");
};

describe("WidgetCard manual refresh", () => {
  beforeEach(() => {
    mockRendererMount.mockClear();
  });

  it("does not render the refresh button when onRefresh is not provided", () => {
    renderCard();
    expect(screen.queryByTestId(REFRESH_TEST_ID)).not.toBeInTheDocument();
  });

  it("re-requests the instance data and shows the updated content", async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { rerender } = renderCard({ onRefresh });
    expect(screen.getByTitle("dashboard.widget.refresh")).toBeInTheDocument();

    await act(async () => clickRefresh());
    rerender({ onRefresh, data: makeData("new") });

    expect(onRefresh).toHaveBeenCalledWith(INSTANCE_ID);
    expect(screen.getByTestId("MockWidgetRenderer")).toHaveTextContent("new");
  });

  it("shows a loading state while refreshing and ignores repeated clicks", async () => {
    const pending = deferred();
    const onRefresh = jest.fn().mockReturnValue(pending.promise);
    renderCard({ onRefresh });

    clickRefresh();
    clickRefresh();

    const button = screen.getByTestId(REFRESH_TEST_ID);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.firstElementChild).toHaveClass("animate-spin");
    expect(screen.getByTestId(BODY_TEST_ID)).toHaveClass("opacity-50");
    expect(screen.getByTestId("MockWidgetRenderer")).toHaveTextContent("old");
    expect(onRefresh).toHaveBeenCalledTimes(1);

    await act(async () => pending.resolve());
    expectIdle();
  });

  it("remounts the renderer after a refresh so local renderer state resets", async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    renderCard({ onRefresh });
    expect(mockRendererMount).toHaveBeenCalledTimes(1);

    await act(async () => clickRefresh());

    expect(mockRendererMount).toHaveBeenCalledTimes(2);
  });

  it("shows the refresh error and keeps the card usable", async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    const { rerender } = renderCard({ onRefresh });

    await act(async () => clickRefresh());
    rerender({ onRefresh, error: "widget down" });

    expect(screen.getByTestId(`WidgetCard__error_${INSTANCE_ID}`)).toHaveTextContent("widget down");
    expectIdle();
  });

  it("logs and releases the loading state when the refresh rejects", async () => {
    const pending = deferred();
    const onRefresh = jest.fn().mockReturnValue(pending.promise);
    renderCard({ onRefresh });

    clickRefresh();
    await act(async () => pending.reject(new Error("boom")));

    expect(logger.warn).toHaveBeenCalledWith(`[WidgetCard] Failed to refresh widget ${INSTANCE_ID}:`, expect.any(Error));
    expectIdle();
  });
});
