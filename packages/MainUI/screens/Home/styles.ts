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

const useStyles = () => {
  return useMemo(
    () => ({
      container: {
        py: 4,
      },
      headerContainer: {
        mb: 4,
      },
      pageTitle: {
        fontWeight: "bold",
      },
      pageSubtitle: {
        color: "text.secondary",
      },
      widgetContainer: {
        p: 3,
        borderRadius: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      },
      widgetHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 2,
      },
      widgetTitleContainer: {
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      },
      iconContainer: {
        width: 40,
        height: 40,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      widgetTitle: {
        fontWeight: "medium",
      },
      actionButton: {
        width: 32,
        height: 32,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s",
      },
      widgetContent: {
        flexGrow: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    }),
    []
  );
};

export default useStyles;
