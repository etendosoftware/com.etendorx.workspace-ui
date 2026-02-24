import { renderHook, act } from "@testing-library/react";
import { useTreeNodeDragDrop } from "../../../hooks/table/useTreeNodeDragDrop";
import { datasource } from "@workspaceui/api-client/src/api/datasource";

// Mock the API client
jest.mock("@workspaceui/api-client/src/api/datasource", () => ({
  datasource: {
    client: {
      request: jest.fn(),
    },
  },
}));

describe("useTreeNodeDragDrop", () => {
  const mockRefetch = jest.fn();
  const mockOnError = jest.fn();
  const mockOnSuccess = jest.fn();

  const mockDisplayRecords = [
    { id: "1", parentId: "-1", canBeParentNode: true },
    { id: "2", parentId: "1", canBeParentNode: true },
    { id: "3", parentId: "-1", canBeParentNode: false },
    { id: "4", parentId: "3", canBeParentNode: false },
  ];

  const defaultProps = {
    shouldUseTreeMode: true,
    treeEntity: "treeEntity",
    tabId: "tabId",
    displayRecords: mockDisplayRecords,
    refetch: mockRefetch,
    onError: mockOnError,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createDragEvent = (types = ["application/x-etendo-tree-node"], ratio = 0.5) => ({
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    dataTransfer: {
      setData: jest.fn(),
      setDragImage: jest.fn(),
      types,
      dropEffect: "none",
    },
    currentTarget: {
      getBoundingClientRect: () => ({ top: 0, height: 100 }),
    },
    clientY: ratio * 100, // Top 30%, Middle 40%, Bottom 30%
  } as unknown as React.DragEvent);

  it("should initialize with default states", () => {
    const { result } = renderHook(() => useTreeNodeDragDrop(defaultProps));

    expect(result.current.dropTarget).toBeNull();
    expect(result.current.draggingRowId).toBeNull();
    expect(result.current.isTreeDragActive).toBe(false);
  });

  it("should handle drag start correctly and set tree drag active", () => {
    const { result } = renderHook(() => useTreeNodeDragDrop(defaultProps));
    const dragProps = result.current.getNodeDragProps(mockDisplayRecords[0]);
    const mockEvent = createDragEvent();

    act(() => {
      dragProps.onDragStart?.(mockEvent);
    });

    expect(result.current.draggingRowId).toBe("1");
    expect(result.current.isTreeDragActive).toBe(true);
    expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith("application/x-etendo-tree-node", "1");
  });

  it("should handle drag end and clean up states", () => {
    const { result } = renderHook(() => useTreeNodeDragDrop(defaultProps));
    const dragProps = result.current.getNodeDragProps(mockDisplayRecords[0]);
    const mockEvent = createDragEvent();
      
    act(() => { dragProps.onDragStart?.(mockEvent); });
    expect(result.current.isTreeDragActive).toBe(true);

    act(() => { dragProps.onDragEnd?.(mockEvent); });

    expect(result.current.draggingRowId).toBeNull();
    expect(result.current.isTreeDragActive).toBe(false);
    expect(result.current.dropTarget).toBeNull();
  });

  it("should handle drag over and calculate position 'before'", () => {
    const { result } = renderHook(() => useTreeNodeDragDrop(defaultProps));
    
    // Drag node 2
    act(() => { result.current.getNodeDragProps(mockDisplayRecords[1]).onDragStart?.(createDragEvent()); });

    // Hover top 20% of node 1
    const mockEventBefore = createDragEvent(["application/x-etendo-tree-node"], 0.2);
    act(() => { result.current.getNodeDropProps(mockDisplayRecords[0]).onDragOver?.(mockEventBefore); });

    expect(result.current.dropTarget).toEqual({ id: "1", position: "before" });
  });

  it("should handle drag over and calculate position 'after'", () => {
    const { result } = renderHook(() => useTreeNodeDragDrop(defaultProps));
    
    // Drag node 1
    act(() => { result.current.getNodeDragProps(mockDisplayRecords[0]).onDragStart?.(createDragEvent()); });

    // Hover bottom 20% of node 3
    const mockEventAfter = createDragEvent(["application/x-etendo-tree-node"], 0.8);
    act(() => { result.current.getNodeDropProps(mockDisplayRecords[2]).onDragOver?.(mockEventAfter); });

    expect(result.current.dropTarget).toEqual({ id: "3", position: "after" });
  });

  it("should handle drop and call API", async () => {
    (datasource.client.request as jest.Mock).mockResolvedValue({
      data: { response: { status: 0, data: [] } },
    });

    const { result } = renderHook(() => useTreeNodeDragDrop(defaultProps));
    
    // Drag node 2
    act(() => { result.current.getNodeDragProps(mockDisplayRecords[1]).onDragStart?.(createDragEvent()); });

    const mockEventDrop = createDragEvent(["application/x-etendo-tree-node"], 0.2); // Position 'before' node 3
    
    await act(async () => {
      await result.current.getNodeDropProps(mockDisplayRecords[2]).onDrop?.(mockEventDrop);
    });

    expect(datasource.client.request).toHaveBeenCalledTimes(1);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });

  it("should handle drop error from backend", async () => {
    (datasource.client.request as jest.Mock).mockResolvedValue({
      data: { response: { status: -1, message: { messageType: "error", message: "Server error" } } },
    });

    const { result } = renderHook(() => useTreeNodeDragDrop(defaultProps));
    
    // Drag node 2
    act(() => { result.current.getNodeDragProps(mockDisplayRecords[1]).onDragStart?.(createDragEvent()); });

    const mockEventDrop = createDragEvent(["application/x-etendo-tree-node"], 0.2);
    
    await act(async () => {
      await result.current.getNodeDropProps(mockDisplayRecords[2]).onDrop?.(mockEventDrop);
    });

    expect(mockOnError).toHaveBeenCalledWith("Server error");
    expect(mockRefetch).not.toHaveBeenCalled();
  });
});
