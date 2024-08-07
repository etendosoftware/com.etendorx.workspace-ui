import { CSSProperties } from 'react';
import { theme } from '../../theme';

const styles: { [key: string]: CSSProperties } = {
  NavStyles: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '4px 4px 0px 4px',
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
    display: 'flex',
    borderRadius: '6.25rem',
    background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
  },
  boxStyles: {
    display: 'flex',
    gap: '4px',
  },
};

export default styles;
