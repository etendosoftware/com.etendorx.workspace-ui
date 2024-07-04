import { CSSProperties } from 'react';
import { theme } from '../../theme';

const styles: { [key: string]: CSSProperties } = {
  NavStyles: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '91rem'
  },
  LeftItems: {
    width: '22.75rem',
    padding: '0 0.25rem',
    borderRadius: '6.25rem',
    background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
  },
  RightItems: {
    height: '3rem',
    padding: '0.25rem',
    width: '14rem',
    borderRadius: '6.25rem',
    background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
  },
};

export default styles;
