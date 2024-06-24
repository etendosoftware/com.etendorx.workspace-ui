import { CSSProperties } from 'react';
import {
  NEUTRAL_10,
  NEUTRAL_100,
  NEUTRAL_300,
  NEUTRAL_50,
  PRIMARY_1000,
  PRIMARY_150,
  PRIMARY_50,
  PRIMARY_CONTRAST,
  PRIMARY_MAIN,
} from '../../colors';
import { SxProps, Theme, styled } from '@mui/material';

export const styles: { [key: string]: CSSProperties } = {
  listContainer: {
    gap: '0.5rem',
  },
  iconContainerStyles: {
    width: '2.25rem',
    height: '2.25rem',
    display: 'flex',
    justifyContent: 'center',
    alignContent: 'center',
    flexWrap: 'wrap',
    background: NEUTRAL_300,
    borderRadius: '100%',
  },
  textContainerStyles: {
    marginLeft: '0.5rem',
    width: '22.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  descriptionStyles: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.25rem',
  },
  ctaButtonContainer: {
    marginTop: '10px',
    display: 'flex',
    gap: '10px',
  },
  dateContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  dateStyles: {
    fontSize: '0.75rem',
    fontWeight: '500',
    marginTop: '0.25rem',
  },
  closeIcon: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    visibility: 'hidden',
    color: PRIMARY_MAIN,
  },
};

export const sx: { [key: string]: SxProps<Theme> } = {
  leftButton: {
    background: PRIMARY_50,
    color: PRIMARY_1000,
    height: '2rem',
    borderRadius: '6.25rem',
    padding: '0.5rem 1rem',
    border: `1px solid ${NEUTRAL_10}`,
    '&:hover': {
      border: 'none',
      background: PRIMARY_MAIN,
      color: PRIMARY_CONTRAST,
    },
  },
  rigthButton: {
    background: NEUTRAL_100,
    color: NEUTRAL_50,
    height: '2rem',
    borderRadius: '6.25rem',
    padding: '0.5rem 1rem',
    '&:hover': {
      border: 'none',
      background: PRIMARY_MAIN,
      color: PRIMARY_CONTRAST,
    },
  },
};

export const StyledListItem = styled('div')(() => ({
  width: '27.25rem',
  borderRadius: '0.75rem',
  margin: '-0.25rem',
  padding: '0.75rem 1rem',
  display: 'flex',
  position: 'relative',
  backgroundColor: PRIMARY_50,
  border: `1px solid ${NEUTRAL_10}`,
  '&:hover': {
    backgroundColor: PRIMARY_CONTRAST,
    outline: `2px solid ${PRIMARY_MAIN}`,
    '& .closeIcon': {
      visibility: 'visible',
      background: PRIMARY_150,
      borderRadius: '100%',
    },
    '& > .textContainer': {
      paddingRight: '1.5rem',
    },
  },
}));
