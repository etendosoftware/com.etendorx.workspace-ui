import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { DatasourceProvider, useDatasourceContext, useGridHasRows } from "../datasourceContext";

const wrapper = ({ children }: { children: ReactNode }) => <DatasourceProvider>{children}</DatasourceProvider>;

describe("useGridHasRows", () => {
  it("is unknown until the grid reports its row count", () => {
    const { result } = renderHook(() => useGridHasRows("tab-1"), { wrapper });
    expect(result.current).toBeUndefined();
  });

  it("is unknown outside a provider and without a tab", () => {
    expect(renderHook(() => useGridHasRows("tab-1")).result.current).toBeUndefined();
    expect(renderHook(() => useGridHasRows(undefined), { wrapper }).result.current).toBeUndefined();
  });

  it("follows the reported count, re-rendering when the grid loads, empties or reloads", () => {
    const { result } = renderHook(() => ({ rows: useGridHasRows("tab-1"), ctx: useDatasourceContext() }), { wrapper });

    act(() => result.current.ctx.setRecordCount("tab-1", 0));
    expect(result.current.rows).toBe(false);

    act(() => result.current.ctx.setRecordCount("tab-1", 3));
    expect(result.current.rows).toBe(true);

    act(() => result.current.ctx.setRecordCount("tab-1", undefined));
    expect(result.current.rows).toBeUndefined();
  });

  it("keeps the counts of different tabs apart", () => {
    const { result } = renderHook(
      () => ({ one: useGridHasRows("tab-1"), two: useGridHasRows("tab-2"), ctx: useDatasourceContext() }),
      { wrapper }
    );

    act(() => {
      result.current.ctx.setRecordCount("tab-1", 0);
      result.current.ctx.setRecordCount("tab-2", 5);
    });
    expect(result.current.one).toBe(false);
    expect(result.current.two).toBe(true);
  });
});
