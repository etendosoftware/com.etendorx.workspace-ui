import { handleCopyRecordResponse, type CopyRecordResponse } from "../utils";

describe("handleCopyRecordResponse", () => {
  const makeCallbacks = () => ({
    onError: jest.fn(),
    onRefreshParent: jest.fn(),
    onSingleRecord: jest.fn(),
    onMultipleRecords: jest.fn(),
  });

  it("calls onError when ok is false", () => {
    const cbs = makeCallbacks();
    handleCopyRecordResponse({ ok: false, data: {}, ...cbs });
    expect(cbs.onError).toHaveBeenCalledTimes(1);
    expect(cbs.onSingleRecord).not.toHaveBeenCalled();
    expect(cbs.onMultipleRecords).not.toHaveBeenCalled();
  });

  it("calls onError when response contains an error action", () => {
    const cbs = makeCallbacks();
    const data: CopyRecordResponse = {
      responseActions: [{ showMsgInProcessView: { msgType: "error", msgText: "Something went wrong" } } as any],
    };
    handleCopyRecordResponse({ ok: true, data, ...cbs });
    expect(cbs.onError).toHaveBeenCalledTimes(1);
  });

  it("calls onSingleRecord with the record id when exactly one record is returned", () => {
    const cbs = makeCallbacks();
    const data: CopyRecordResponse = { records: [{ id: "rec-123" }] };
    handleCopyRecordResponse({ ok: true, data, ...cbs });
    expect(cbs.onSingleRecord).toHaveBeenCalledWith("rec-123");
    expect(cbs.onMultipleRecords).not.toHaveBeenCalled();
  });

  it("calls onMultipleRecords when more than one record is returned", () => {
    const cbs = makeCallbacks();
    const data: CopyRecordResponse = { records: [{ id: "rec-1" }, { id: "rec-2" }] };
    handleCopyRecordResponse({ ok: true, data, ...cbs });
    expect(cbs.onMultipleRecords).toHaveBeenCalledTimes(1);
    expect(cbs.onSingleRecord).not.toHaveBeenCalled();
  });

  it("calls onRefreshParent when refreshParent is true", () => {
    const cbs = makeCallbacks();
    const data: CopyRecordResponse = { refreshParent: true, records: [{ id: "rec-1" }] };
    handleCopyRecordResponse({ ok: true, data, ...cbs });
    expect(cbs.onRefreshParent).toHaveBeenCalledTimes(1);
  });

  it("does not call onRefreshParent when refreshParent is false", () => {
    const cbs = makeCallbacks();
    const data: CopyRecordResponse = { refreshParent: false, records: [] };
    handleCopyRecordResponse({ ok: true, data, ...cbs });
    expect(cbs.onRefreshParent).not.toHaveBeenCalled();
  });

  it("calls onMultipleRecords when records array is empty", () => {
    const cbs = makeCallbacks();
    handleCopyRecordResponse({ ok: true, data: { records: [] }, ...cbs });
    expect(cbs.onMultipleRecords).toHaveBeenCalledTimes(1);
  });

  it("calls onMultipleRecords when data has no records", () => {
    const cbs = makeCallbacks();
    handleCopyRecordResponse({ ok: true, data: {}, ...cbs });
    expect(cbs.onMultipleRecords).toHaveBeenCalledTimes(1);
  });
});
