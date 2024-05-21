import { CSSProperties } from 'react';
import { SxProps, Theme } from '@mui/material';
import { NEUTRAL_100, NEUTRAL_850, PRIMARY_1000, PRIMARY_150, PRIMARY_450, PRIMARY_50, PRIMARY_950, START_750, TERTIARY_1000 } from '../../colors';

// Font sizes
const FONT_SIZE_14 = 14;

// Widths
const WIDTH_24 = 24;
const WIDTH_22 = 22;
const WIDTH_FULL = '100%';

// Styles
export const containerBoxStyles: SxProps<Theme> = {
	position: 'relative',
	width: WIDTH_FULL,
};

export const innerBoxStyles: SxProps<Theme> = {
	position: 'relative',
};

export const startAdornmentStyles: SxProps<Theme> = {
	width: WIDTH_24,
	display: 'flex',
	justifyContent: 'center',
	gap: '0.5rem',
};

export const inputPropsStyles: CSSProperties = {
	position: 'relative',
	color: PRIMARY_450,
	fontSize: FONT_SIZE_14,
};

export const inputStyles: CSSProperties | any = {
	padding: '0.5rem 0.75rem 0.5rem 0.75rem',
	height: '2.5rem',
	borderRadius: '6.25rem',
	backgroundColor: PRIMARY_50,
	transition: 'background-color 0.5s ease',
	'&:hover': {
		backgroundColor: TERTIARY_1000,
	},
	'&.Mui-disabled': {
		backgroundColor: PRIMARY_950,
	},
	'&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
		borderColor: "transparent",
	},
};

export const inputCommonStyles: CSSProperties | any = {
	borderRadius: '6.25rem',
	position: 'relative',
	transition: 'background-color 0.3s, border-color 0.3s',
	'&:hover': {
		backgroundColor: PRIMARY_950,
	},
};

export const tabBoxStyles: SxProps<Theme> = {
	display: 'flex',
	alignItems: 'center',
	marginLeft: '0.25rem',
	backgroundColor: NEUTRAL_100,
	height: WIDTH_24,
	padding: '0.5rem',
	borderRadius: 100,
};

export const tabTextStyles: React.CSSProperties = {
	fontSize: FONT_SIZE_14,
	fontWeight: 500,
	color: NEUTRAL_850,
	marginLeft: '0.25rem',
};

export const suggestionBoxStyles: SxProps<Theme> = {
	position: 'absolute',
	top: '50%',
	left: 44,
	transform: 'translateY(-50%)',
	color: PRIMARY_1000,
	fontSize: FONT_SIZE_14,
	pointerEvents: 'none',
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	display: 'flex',
	alignItems: 'center'
};

export const cleanTextStyles: React.CSSProperties = {
	color: START_750,
	fontSize: FONT_SIZE_14,
	fontWeight: 500,
};

export const iconWidthStyle: SxProps<Theme> = {
	width: WIDTH_22,
};

export const suggestionTextStyles: React.CSSProperties = {
	color: PRIMARY_150,
};

export const clearButtonStyles: SxProps<Theme> = {
	'&:hover': {
		backgroundColor: 'transparent',
		textDecoration: 'underline',
	},
};

export const rightButtonStyles = (): SxProps<Theme> => ({
	'&:hover': {
		backgroundColor: 'transparent',
	},
});

export const spanOpacityStyle: CSSProperties = {
	opacity: 0,
};

export const tabIconStyles: SxProps<Theme> = {
	fontSize: FONT_SIZE_14,
	color: NEUTRAL_850,
};
