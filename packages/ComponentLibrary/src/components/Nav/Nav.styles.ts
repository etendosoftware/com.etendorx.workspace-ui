import { CSSProperties } from "react";
import { theme } from "../../theme";

export const NavStyles: CSSProperties = {
    display: 'flex',
    width: '93.5rem',
    height: '3rem',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '12.5rem',
    background: `var(--Neutral-0, ${theme.palette.baselineColor.neutral[0]})`,
    boxShadow: `0rem 0.125rem 0.25rem 0rem var(--transparent-neutral-10, ${theme.palette.baselineColor.neutral[80]})`,
}

export const boxStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  textAlign: 'center',
};
  
export const avatarStyles: CSSProperties = {
  width: '2.5rem',
  height: '2.5rem',
};
  
export const logoContainerStyles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

export const logoStyles: CSSProperties = {
  width: '2.5em',
  height: '2.5rem',
  marginRight: '0.5rem',
  paddingLeft: '0.25rem',
};
  
export const companyNameStyles: CSSProperties = {
  fontSize: '1rem',
  color: `var(--Neutral-90, ${theme.palette.baselineColor.neutral[90]})`,
  fontWeight: '600',
};
  
export const AppStyles: CSSProperties = {
  width: '3rem', 
  height: '3rem', 
  background: theme.palette.baselineColor.neutral[0], 
  margin: '1rem',
  padding: '1rem',
  border: `0.25rem solid ${theme.palette.baselineColor.neutral[20]}`,
}