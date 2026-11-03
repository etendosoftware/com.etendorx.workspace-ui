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

import type React from "react";

/** Size of the Classic `levelImg_<level>_<max>.png` images. */
const WIDTH = 41;
const HEIGHT = 20;
const BAR_GAP = 2;
const FILLED_COLOR = "var(--color-success-main)";
const EMPTY_COLOR = "var(--color-baseline-40)";

interface LevelIndicatorCellProps {
  /** Filled steps. */
  level: number;
  /** Total steps. */
  max: number;
  "data-testid"?: string;
}

/**
 * Signal-style level indicator, the new-UI rendering of the Classic
 * `OBLevelImg` cell: `max` bars of increasing height with the first `level`
 * filled.
 */
export const LevelIndicatorCell: React.FC<LevelIndicatorCellProps> = ({ level, max, "data-testid": testId }) => {
  const barWidth = (WIDTH - BAR_GAP * (max - 1)) / max;
  const bars = Array.from({ length: max }, (_, index) => {
    const barHeight = (HEIGHT * (index + 1)) / max;
    const isFilled = index < level;
    return (
      <rect
        key={index}
        data-filled={isFilled}
        x={index * (barWidth + BAR_GAP) + 0.5}
        y={HEIGHT - barHeight + 0.5}
        width={barWidth - 1}
        height={barHeight - 1}
        fill={isFilled ? FILLED_COLOR : "none"}
        stroke={isFilled ? FILLED_COLOR : EMPTY_COLOR}
      />
    );
  });

  return (
    <div className="flex w-full justify-center" data-testid={testId}>
      <svg role="img" aria-label={`${level}/${max}`} width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {bars}
      </svg>
    </div>
  );
};

export default LevelIndicatorCell;
