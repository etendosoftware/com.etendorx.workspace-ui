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

import { useMemo } from "react";
import { Box, useTheme } from "@mui/material";

const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      dottedLine: {
        backgroundImage: `radial-gradient(circle, ${theme.palette.divider} 1px, transparent 1px)`,
        backgroundSize: "8px 8px",
        backgroundPosition: "right",
        backgroundRepeat: "repeat-y",
        width: "8px",
        height: "100%",
        margin: "0 1rem",
      },
    }),
    [theme.palette.divider]
  );
};

const DottedLine = ({
  fields,
  dottedLineInterval,
  index,
}: {
  fields: unknown[];
  dottedLineInterval: number;
  index: number;
}) => {
  const { dottedLine } = useStyle();
  const shouldRenderDottedLine = index < fields.length && (index + 1) % dottedLineInterval !== 0;

  if (shouldRenderDottedLine) {
    return <Box sx={dottedLine} />;
  }

  return null;
};

export default DottedLine;
