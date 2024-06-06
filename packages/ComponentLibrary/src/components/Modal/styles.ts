import { CSSProperties } from "react";
import { NEUTRAL_50, NEUTRAL_10, NEUTRAL_900 } from "../../colors";

const styles: { [key: string]: CSSProperties } = {
  boxStyles: {
    position: 'absolute',
    width: '18.75rem',
    backgroundColor: NEUTRAL_50,
    border: `2px solid ${NEUTRAL_10}`,
    borderRadius: '1rem',
    boxShadow: `0px 0.25rem 0.625rem 0px ${NEUTRAL_900}`,
  },
  modalStyles: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default styles;