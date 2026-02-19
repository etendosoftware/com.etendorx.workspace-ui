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

import { renderHook, act } from "@testing-library/react";
import { useRowDropZone } from "../useRowDropZone";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

describe("useRowDropZone", () => {
  const mockRecord: EntityData = {
    id: "test-record-1",
    name: "Test Record",
  };

  const createMockDragEvent = (
    files: Partial<File>[] = [],
    options: { relatedTarget?: Node | null; currentTarget?: HTMLElement } = {}
  ): React.DragEvent => {
    const mockRect = {
      top: 100,
      left: 100,
      width: 500,
      height: 50,
      right: 600,
      bottom: 150,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    };

    const mockCurrentTarget = options.currentTarget || {
      getBoundingClientRect: jest.fn().mockReturnValue(mockRect),
      contains: jest.fn().mockReturnValue(false),
    };

    const items = files.map((file) => ({
      kind: "file" as const,
      type: file.type || "application/octet-stream",
      getAsFile: () => file as File,
    }));

    return {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        items: items,
        files: files as unknown as FileList,
        dropEffect: "none",
      },
      currentTarget: mockCurrentTarget,
      relatedTarget: options.relatedTarget ?? null,
    } as unknown as React.DragEvent;
  };

  const createMockFile = (name: string, type: string): Partial<File> => ({ name, type });

  const createMockFiles = (count: number, type = "application/pdf"): Partial<File>[] =>
    Array(count)
      .fill(null)
      .map((_, i) => createMockFile(`file${i}.pdf`, type));

  interface HookSetupOptions {
    onFileDrop?: jest.Mock;
    onDragStateChange?: jest.Mock;
    acceptedFileTypes?: string[];
    maxFiles?: number;
  }

  /**
   * Sets up the hook with mocks and returns utilities for testing
   */
  const setupHook = (options: HookSetupOptions = {}) => {
    const onFileDrop = options.onFileDrop ?? jest.fn();
    const onDragStateChange = options.onDragStateChange ?? jest.fn();

    const { result, rerender } = renderHook(
      (props: HookSetupOptions) =>
        useRowDropZone({
          onFileDrop: props.onFileDrop,
          onDragStateChange: props.onDragStateChange,
          acceptedFileTypes: props.acceptedFileTypes,
          maxFiles: props.maxFiles,
        }),
      {
        initialProps: {
          onFileDrop,
          onDragStateChange,
          acceptedFileTypes: options.acceptedFileTypes,
          maxFiles: options.maxFiles,
        },
      }
    );

    const getProps = () => result.current.getRowDropZoneProps(mockRecord);

    return { result, rerender, getProps, onFileDrop, onDragStateChange };
  };

  /**
   * Executes a drag event handler and returns the event for assertions
   */
  const executeHandler = (
    handler: (e: React.DragEvent) => void,
    files: Partial<File>[] = [createMockFile("test.pdf", "application/pdf")],
    eventOptions?: Parameters<typeof createMockDragEvent>[1]
  ) => {
    const event = createMockDragEvent(files, eventOptions);
    act(() => {
      handler(event);
    });
    return event;
  };

  /**
   * Helper for file drop validation tests
   */
  const testFileDrop = ({
    files,
    acceptedFileTypes,
    maxFiles,
    expectedToBeAccepted,
  }: {
    files: Partial<File>[];
    acceptedFileTypes?: string[];
    maxFiles?: number;
    expectedToBeAccepted: boolean;
  }) => {
    const { getProps, onFileDrop } = setupHook({ acceptedFileTypes, maxFiles });
    executeHandler(getProps().onDrop, files);

    if (expectedToBeAccepted) {
      expect(onFileDrop).toHaveBeenCalled();
    } else {
      expect(onFileDrop).not.toHaveBeenCalled();
    }
  };

  describe("initialization", () => {
    it("should return getRowDropZoneProps function", () => {
      const { result } = setupHook();

      expect(result.current.getRowDropZoneProps).toBeDefined();
      expect(typeof result.current.getRowDropZoneProps).toBe("function");
    });

    it("should return drop zone props for a record", () => {
      const { getProps } = setupHook();
      const props = getProps();

      expect(props.onDragEnter).toBeDefined();
      expect(props.onDragOver).toBeDefined();
      expect(props.onDragLeave).toBeDefined();
      expect(props.onDrop).toBeDefined();
    });
  });

  describe("handleDragEnter", () => {
    it("should call onDragStateChange with rect and recordId when valid files are dragged", () => {
      const { getProps, onDragStateChange } = setupHook();
      const event = executeHandler(getProps().onDragEnter);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(onDragStateChange).toHaveBeenCalledWith(expect.objectContaining({ recordId: "test-record-1" }));
    });

    it("should not call onDragStateChange when no files are dragged", () => {
      const { getProps, onDragStateChange } = setupHook();
      executeHandler(getProps().onDragEnter, []);

      expect(onDragStateChange).not.toHaveBeenCalled();
    });
  });

  describe("handleDragOver", () => {
    it("should set dropEffect to copy when valid files are dragged", () => {
      const { getProps } = setupHook();
      const event = executeHandler(getProps().onDragOver, [createMockFile("image.png", "image/png")]);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.dataTransfer.dropEffect).toBe("copy");
    });

    it("should set dropEffect to none when invalid files are dragged", () => {
      const { getProps, onDragStateChange } = setupHook({ acceptedFileTypes: ["image/*"] });
      const event = executeHandler(getProps().onDragOver);

      expect(event.dataTransfer.dropEffect).toBe("none");
      expect(onDragStateChange).toHaveBeenCalledWith(null);
    });
  });

  describe("handleDragLeave", () => {
    it("should call onDragStateChange with null when leaving the target", () => {
      const { getProps, onDragStateChange } = setupHook();
      const event = executeHandler(getProps().onDragLeave);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(onDragStateChange).toHaveBeenCalledWith(null);
    });

    it("should not clear state when moving to a child element", () => {
      const { getProps, onDragStateChange } = setupHook();
      const childElement = document.createElement("div");
      const currentTarget = {
        getBoundingClientRect: jest.fn().mockReturnValue({ top: 0, left: 0 }),
        contains: jest.fn().mockReturnValue(true),
      };

      executeHandler(getProps().onDragLeave, [createMockFile("image.png", "image/png")], {
        relatedTarget: childElement,
        currentTarget: currentTarget as unknown as HTMLElement,
      });

      expect(onDragStateChange).not.toHaveBeenCalled();
    });
  });

  describe("handleDrop", () => {
    it("should call onFileDrop with files and record when valid files are dropped", () => {
      const { getProps, onFileDrop } = setupHook();
      const event = executeHandler(getProps().onDrop);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(onFileDrop).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ name: "test.pdf" })]),
        mockRecord
      );
    });

    it("should not call onFileDrop when no files are dropped", () => {
      const { getProps, onFileDrop, onDragStateChange } = setupHook();
      executeHandler(getProps().onDrop, []);

      expect(onFileDrop).not.toHaveBeenCalled();
      expect(onDragStateChange).toHaveBeenCalledWith(null);
    });

    it("should clear drag state after drop", () => {
      const { getProps, onDragStateChange } = setupHook();
      executeHandler(getProps().onDrop);

      expect(onDragStateChange).toHaveBeenCalledWith(null);
    });
  });

  describe("file validation", () => {
    describe("file type filtering", () => {
      it.each([
        {
          name: "should accept files matching wildcard types (e.g., image/*)",
          files: [createMockFile("photo.jpg", "image/jpeg")],
          acceptedFileTypes: ["image/*"],
          expectedToBeAccepted: true,
        },
        {
          name: "should reject files not matching accepted types",
          files: [createMockFile("document.pdf", "application/pdf")],
          acceptedFileTypes: ["image/*"],
          expectedToBeAccepted: false,
        },
        {
          name: "should accept files matching exact types",
          files: [createMockFile("document.pdf", "application/pdf")],
          acceptedFileTypes: ["application/pdf"],
          expectedToBeAccepted: true,
        },
        {
          name: "should accept multiple file types with mixed wildcards",
          files: [createMockFile("photo.png", "image/png")],
          acceptedFileTypes: ["application/pdf", "image/*"],
          expectedToBeAccepted: true,
        },
      ])("$name", ({ files, acceptedFileTypes, expectedToBeAccepted }) => {
        testFileDrop({ files, acceptedFileTypes, expectedToBeAccepted });
      });
    });

    describe("maxFiles limit", () => {
      it.each([
        {
          name: "should respect maxFiles limit (reject excess)",
          fileCount: 3,
          maxFiles: 2,
          expectedToBeAccepted: false,
        },
        { name: "should allow files within maxFiles limit", fileCount: 2, maxFiles: 2, expectedToBeAccepted: true },
        { name: "should allow single file when maxFiles is 1", fileCount: 1, maxFiles: 1, expectedToBeAccepted: true },
        { name: "should use default maxFiles of 10", fileCount: 10, maxFiles: undefined, expectedToBeAccepted: true },
        {
          name: "should reject when exceeding default maxFiles",
          fileCount: 11,
          maxFiles: undefined,
          expectedToBeAccepted: false,
        },
      ])("$name", ({ fileCount, maxFiles, expectedToBeAccepted }) => {
        testFileDrop({ files: createMockFiles(fileCount), maxFiles, expectedToBeAccepted });
      });
    });
  });

  describe("options update", () => {
    it("should use updated callbacks after rerender", () => {
      const onFileDrop1 = jest.fn();
      const onFileDrop2 = jest.fn();
      const onDragStateChange = jest.fn();

      const { result, rerender } = renderHook(({ onFileDrop }) => useRowDropZone({ onFileDrop, onDragStateChange }), {
        initialProps: { onFileDrop: onFileDrop1 },
      });

      rerender({ onFileDrop: onFileDrop2 });

      const props = result.current.getRowDropZoneProps(mockRecord);
      const event = createMockDragEvent([createMockFile("test.pdf", "application/pdf")]);

      act(() => {
        props.onDrop(event);
      });

      expect(onFileDrop1).not.toHaveBeenCalled();
      expect(onFileDrop2).toHaveBeenCalled();
    });
  });
});
