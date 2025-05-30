import Image from "next/image";
import type { Base64IconProps } from "./types";

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

  return <Image src={src} alt={alt} width={size} height={size} className={combinedClasses} />;
};

export default Base64Icon;
