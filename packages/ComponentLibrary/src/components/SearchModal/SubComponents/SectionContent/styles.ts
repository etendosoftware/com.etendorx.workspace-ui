// SectionContent/styles.ts

import { theme } from "../../../../theme";

export const styles = {
  sectionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  sectionBox: (isLast: boolean) => ({
    borderBottom: isLast ? 'none' : `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
  }),
  sectionInnerBox: {
    padding: '0.75rem',
    paddingBottom: '0.25rem',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  contentWrapper: {
    borderRadius: '0.75rem',
  },
  sectionTitleContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginBottom: '0.25rem',
    borderBottom: '1px solid transparent',
    '&:hover': {
      borderBottom: `1px solid ${theme.palette.baselineColor.etendoPrimary.main}`,
      cursor: 'pointer',
    },
  },
  sectionTitle: {
    color: theme.palette.baselineColor.etendoPrimary.main,
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    fontWeight: 500,
  },
  arrowIcon: {
    rotate: '320deg',
    color: theme.palette.baselineColor.etendoPrimary.main,
    fontSize: '1rem',
  },
  itemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
};
