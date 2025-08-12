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

interface ILogo {
  title?: string;
  logo?: string | React.ReactNode;
}

const Logo = ({ logo, title }: ILogo) => {
  const commonClasses = "w-9 h-9";
  if (typeof logo === "string") {
    return <img src={logo} className={commonClasses} alt={`${title} Logo`} />;
  }
  return <div className={commonClasses}>{logo}</div>;
};

export default Logo;
