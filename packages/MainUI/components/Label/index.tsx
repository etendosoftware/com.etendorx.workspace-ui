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

interface LabelProps {
  htmlFor: string;
  name: string;
  onClick?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  link?: boolean;
}

export default function Label({ htmlFor, name, onClick, onKeyDown, link }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium select-none truncate ${link ? "text-(--color-dynamic-main) cursor-pointer" : "text-gray-700"}`}
      onClick={(e) => onClick?.(e)}
      onKeyDown={(e) => onKeyDown?.(e)}
      {...(link ? { role: "button", tabIndex: 0, "aria-label": "Navigate to referenced window" } : {})}>
      {name}
    </label>
  );
}
