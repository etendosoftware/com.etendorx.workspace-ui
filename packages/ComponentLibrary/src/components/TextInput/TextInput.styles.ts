import { SxProps, Theme } from '@mui/material';
import { BLACK_100, BLACK_200, BLACK_900, GREY_5, LIGHT_BLUE_100, LIGHT_BLUE_50, LIGHT_BLUE_20, WHITE_50, GREY_50 } from '../../styles/colors';
import { CSSProperties } from 'react';

export const containerBoxStyles: SxProps<Theme> = {
	position: 'relative',
	width: '100%',
};

export const innerBoxStyles: SxProps<Theme> = {
	position: 'relative',
};

export const startAdornmentStyles: SxProps<Theme> = {
	width: 24,
	display: 'flex',
	justifyContent: 'center',
	gap: '8px',
};

export const inputPropsStyles: CSSProperties = {
	position: 'relative',
	color: BLACK_900,
	fontSize: 14,
};

export const inputStyles = {
	backgroundColor: WHITE_50,
	padding: '8px 12px 8px 12px',
	height: '2.5rem',
	borderRadius: '100px',
	'&.Mui-disabled': {
		backgroundColor: BLACK_100,
	},
	'&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
		borderColor: "transparent",
	},
};

export const inputCommonStyles: CSSProperties | any = {
	borderRadius: '100px',
	position: 'relative',
	transition: 'background-color 0.3s, border-color 0.3s',
	'&:hover': {
		backgroundColor: BLACK_100,
	},
	'& .MuiOutlinedInput-root': {
		'& fieldset': {
			borderColor: BLACK_100,
		},
		'&:hover fieldset': {
			borderWidth: 0,
		},
		'&.Mui-focused fieldset': {
			borderColor: LIGHT_BLUE_100,
		},
		'&.Mui-focused': {
			backgroundColor: LIGHT_BLUE_50,
		},
		borderRadius: '100px',
	},
};

export const tabBoxStyles: SxProps<Theme> = {
	display: 'flex',
	alignItems: 'center',
	marginLeft: '4px',
	backgroundColor: GREY_5,
	height: 24,
	padding: '8px 8px',
	borderRadius: 100,
};

export const tabTextStyles: React.CSSProperties = {
	fontSize: 14,
	fontWeight: 500,
	color: '#4F4F4F',
	marginLeft: '4px',
};

export const suggestionBoxStyles: SxProps<Theme> = {
	position: 'absolute',
	top: '50%',
	left: 44,
	transform: 'translateY(-50%)',
	color: BLACK_200,
	fontSize: 14,
	pointerEvents: 'none',
	whiteSpace: 'nowrap',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	display: 'flex',
	alignItems: 'center'
};

export const cleanTextStyles: React.CSSProperties = {
	color: LIGHT_BLUE_100,
	fontSize: 14,
	fontWeight: 500,
};

export const iconWidthStyle: SxProps<Theme> = {
	width: 22,
};

export const suggestionTextStyles: React.CSSProperties = {
	color: LIGHT_BLUE_20
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
	fontSize: 14,
	color: GREY_50,
};