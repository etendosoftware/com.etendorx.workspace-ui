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
