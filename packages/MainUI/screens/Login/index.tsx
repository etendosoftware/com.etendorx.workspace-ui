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

import { useCallback, useState } from "react";
import { useUserContext } from "../../hooks/useUserContext";
import { logger } from "../../utils/logger";
import Login from "../../components/Forms/Login/Login";

export default function LoginScreen() {
  const [error, setError] = useState("");
  const { login } = useUserContext();

  const handleLogin = useCallback(
    async (username: string, password: string) => {
      try {
        await login(username, password);
      } catch (e) {
        logger.warn(e);

        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [login]
  );

  return <Login title="Etendo" onSubmit={handleLogin} error={error} data-testid="Login__da518c" />;
}
