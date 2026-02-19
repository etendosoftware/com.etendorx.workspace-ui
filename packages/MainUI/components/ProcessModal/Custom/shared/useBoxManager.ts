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

import React, { useCallback, useRef, useState } from "react";

export interface UseBoxManagerResult<T extends Record<string, unknown> = Record<string, unknown>> {
  boxCount: number;
  currentBox: number;
  setBoxCount: React.Dispatch<React.SetStateAction<number>>;
  setCurrentBox: React.Dispatch<React.SetStateAction<number>>;
  handleAddBox: (setLines: React.Dispatch<React.SetStateAction<T[]>>) => void;
  handleRemoveBox: (setLines: React.Dispatch<React.SetStateAction<T[]>>) => void;
  barcodeInputRef: React.RefObject<HTMLInputElement | null>;
}

export function useBoxManager<T extends Record<string, unknown> = Record<string, unknown>>(
  initialBoxCount = 1
): UseBoxManagerResult<T> {
  const [boxCount, setBoxCount] = useState(initialBoxCount);
  const [currentBox, setCurrentBox] = useState(1);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const handleAddBox = useCallback(
    (setLines: React.Dispatch<React.SetStateAction<T[]>>) => {
      const newBoxNo = boxCount + 1;
      setBoxCount(newBoxNo);
      setCurrentBox(newBoxNo);
      setLines((prev) => prev.map((line) => ({ ...line, [`box${newBoxNo}`]: 0 }) as T));
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    },
    [boxCount]
  );

  const handleRemoveBox = useCallback(
    (setLines: React.Dispatch<React.SetStateAction<T[]>>) => {
      if (boxCount <= 1) return;
      setLines((prev) =>
        prev.map((line) => {
          const newLine = { ...line };
          delete newLine[`box${boxCount}`];
          return newLine as T;
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
