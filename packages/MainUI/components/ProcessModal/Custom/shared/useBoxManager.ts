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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * @fileoverview useBoxManager — shared hook for box count/navigation state
 * used by PackingProcess and PickValidateProcess.
 */

import { useCallback, useRef, useState } from "react";

export interface UseBoxManagerResult {
  boxCount: number;
  currentBox: number;
  setBoxCount: (n: number) => void;
  setCurrentBox: (n: number) => void;
  handleAddBox: (setLines: (updater: (prev: Record<string, unknown>[]) => Record<string, unknown>[]) => void) => void;
  handleRemoveBox: (
    setLines: (updater: (prev: Record<string, unknown>[]) => Record<string, unknown>[]) => void
  ) => void;
  barcodeInputRef: React.RefObject<HTMLInputElement>;
}

export function useBoxManager(initialBoxCount = 1): UseBoxManagerResult {
  const [boxCount, setBoxCount] = useState(initialBoxCount);
  const [currentBox, setCurrentBox] = useState(1);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const handleAddBox = useCallback(
    (setLines: (updater: (prev: Record<string, unknown>[]) => Record<string, unknown>[]) => void) => {
      const newBoxNo = boxCount + 1;
      setBoxCount(newBoxNo);
      setCurrentBox(newBoxNo);
      setLines((prev) => prev.map((line) => ({ ...line, [`box${newBoxNo}`]: 0 })));
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    },
    [boxCount]
  );

  const handleRemoveBox = useCallback(
    (setLines: (updater: (prev: Record<string, unknown>[]) => Record<string, unknown>[]) => void) => {
      if (boxCount <= 1) return;
      setLines((prev) =>
        prev.map((line) => {
          const newLine = { ...line };
          delete newLine[`box${boxCount}`];
          return newLine;
        })
      );
      const newCount = boxCount - 1;
      setBoxCount(newCount);
      if (currentBox >= boxCount) setCurrentBox(newCount);
    },
    [boxCount, currentBox]
  );

  return {
    boxCount,
    currentBox,
    setBoxCount,
    setCurrentBox,
    handleAddBox,
    handleRemoveBox,
    barcodeInputRef,
  };
}
