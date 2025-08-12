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

import { render, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event/dist/types/setup/setup";
import IconButton, { type IconButtonProps } from "../src/components/IconButton";

interface RenderIconButtonResult {
  user: UserEvent;
  view: RenderResult;
}

/**
 * Renderiza el componente IconButton con props por defecto y opcionales.
 * Retorna una instancia de userEvent y el resultado del render para interactuar con el componente.
 *
 * @param props - Propiedades para sobreescribir las de por defecto.
 * @returns {RenderIconButtonResult & RenderResult} - Un objeto con user, view y los helpers de testing.
 */
export const renderIconButton = (props: Partial<IconButtonProps> = {}): RenderIconButtonResult & RenderResult => {
  const defaultProps: IconButtonProps = {
    ariaLabel: "icon button",
    children: <svg data-testid="default-icon" />,
    ...props,
  };

  const view = render(<IconButton {...defaultProps} />);

  return {
    user: userEvent.setup(),
    view,
    ...view,
  };
};
