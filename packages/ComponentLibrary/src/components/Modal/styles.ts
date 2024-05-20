import { CSSProperties } from "react";

const styles: { [key: string]: CSSProperties} = {
  boxStyles: {
    position: 'absolute',
    width: '18.75rem',
    backgroundColor: '#FAFAFA',
    border: '1px solid #03030333',
    borderRadius: '1rem',
    boxShadow: '0px 0.25rem 0.625rem 0px #03030333',
  },
  modalStyles: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default styles;