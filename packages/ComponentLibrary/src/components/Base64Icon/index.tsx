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

export interface Base64IconProps {
  src: string;
  alt?: string;
  className?: string;
  size?: number;
}

const DEFAULT_PROPS = {
  alt: "Icon",
  className: "",
  size: 16,
};

const CSS_CLASSES = {
  base: "icon-base64",
  hoverPrefix: "icon-hover-",
} as const;

const Base64Icon: React.FC<Base64IconProps> = ({
  src,
  alt = DEFAULT_PROPS.alt,
  className = DEFAULT_PROPS.className,
  size = DEFAULT_PROPS.size,
}) => {
  const combinedClasses = `${CSS_CLASSES.base} ${className}`.trim();

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`w-${Math.round(size / 4)} h-${Math.round(size / 4)} ${combinedClasses}`}
    />
  );
};

export default Base64Icon;
