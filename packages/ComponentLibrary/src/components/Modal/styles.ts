import { CSSProperties } from "react";
import { theme } from "../../theme";

const styles: { [key: string]: CSSProperties } = {
  boxStyles: {
    position: 'absolute',
    width: '18.75rem',
    backgroundColor: theme.palette.baselineColor.neutral[0],
    border: `2px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
    borderRadius: '1rem',
    boxShadow: `0px 0.25rem 0.625rem 0px ${theme.palette.baselineColor.neutral[90]}`,
  },
  modalStyles: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default styles;