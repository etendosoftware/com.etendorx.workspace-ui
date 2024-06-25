import {
  QUATERNARY_10,
  PRIMARY_100,
} from 'etendo-ui-library/dist-web/styles/colors';
import { StyleSheet } from 'react-native';

export const commonStyles = {
  container: {
    padding: '2rem',
    backgroundColor: QUATERNARY_10,
    borderRadius: '10px',
    fontFamily: 'Helvetica, Arial, sans-serif',
    lineHeight: 1.5,
  },
  subheading: {
    fontWeight: 700,
    fontSize: '1.25rem',
    color: PRIMARY_100,
    letterSpacing: 2,
    lineHeight: '2rem',
    textTransform: 'uppercase',
    marginBottom: '2rem',
    display: 'flex',
  },
};
export const inputStyles: any = {
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 20,
  },
  input: {
    width: '400px',
    margin: 10,
  },
};

export const iconStyles: any = {
  general: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  container: {
    marginVertical: 20,
    alignItems: 'center',
    width: 120,
    minHeight: 50,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  icon: {
    width: 40,
    height: 40,
    marginBottom: 20,
  },
  text: {
    marginTop: 'auto',
    textAlign: 'center',
    fontSize: 12,
  },
};

export const styles = {
  ...commonStyles,
  linkList: {
    display: 'flex',
    marginTop: '2rem',
    gap: '2rem',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
};

export const gridStyles = {
  ...commonStyles,
  linkList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: '1rem',
  },
};

export const stylesFullWidth = {
  ...commonStyles,
  linkList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
};

export const cardDropdownStyles = {
  container: {
    padding: '2rem',
    backgroundColor: QUATERNARY_10,
    borderRadius: '10px',
    fontFamily: 'Helvetica, Arial, sans-serif',
    lineHeight: 1.5,
  },
  subheading: {
    fontWeight: 700,
    fontSize: '1.25rem',
    color: PRIMARY_100,
    letterSpacing: 2,
    lineHeight: '2rem',
    textTransform: 'uppercase',
    marginBottom: '2rem',
    display: 'center',
  },
};

export const cardDropdown = {
  ...commonStyles,
  linkList: {
    display: 'flex',
    marginTop: '2rem',
    gap: '2rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  container: {
    width: '100%',
    flexDirection: 'row',
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: 'repeat(3, 1fr)',
    marginBottom: 25,
  },
};

export const navbarStyles = {
  containerMobile: {
    width: 950,
  },
  containerWeb: {
    width: 1081,
  },
};

export const tableStyles = {
  templateContainer: {
    maxWidth: '800px',
    margin: '20px auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Arial, sans-serif',
    width: '100%',
    boxSizing: 'border-box',
  },
  title: {
    color: PRIMARY_100,
    fontSize: '24px',
    marginBottom: '10px',
  },
  description: {
    color: '#666',
    lineHeight: '1.6',
  },
  tableWrapper: {
    marginTop: '20px',
  },
  infoContainer: {
    marginTop: '20px',
  },
  h2: {
    color: PRIMARY_100,
    fontSize: '18px',
  },
  infoText: {
    color: PRIMARY_100,
    lineHeight: '1.6',
  },
  infoList: {
    listStyleType: 'disc',
    marginLeft: '20px',
  },
  infoListItem: {
    marginBottom: '10px',
  },
};

export const buttonStyles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  buttonLoadingColumn: {
    width: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
