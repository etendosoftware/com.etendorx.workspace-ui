import { CSSProperties } from 'react';
import { theme } from '../../theme';

const styles: { [key: string]: CSSProperties } = {
  NavStyles: {
    display: 'flex',
    width: '91rem',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  LeftItems: {
    width: '22.75rem',
    padding: '0 0.25rem',
    borderRadius: '6.25rem',
    background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
  },
  RightItems: {
    display: 'flex',
    height: '3rem',
    padding: '0.25rem',
    width: '14rem',
    borderRadius: '6.25rem',
    background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
  },
  boxStyles: {},
};

export default styles;
