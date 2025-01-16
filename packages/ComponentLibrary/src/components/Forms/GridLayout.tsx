import { Box, Paper, Typography } from '@mui/material';
import { useStyle } from './styles';
import { SECONDARY_100, SECONDARY_500, PRIMARY_100 } from '../../theme';
import EtendoImg from '../../assets/images/Etendo.svg?url';
import { GridItemProps } from './types';

const GridItem = ({ bgColor = 'transparent', children }: GridItemProps) => {
  const { styles } = useStyle();

  return (
    <Paper
      elevation={8}
      sx={{
        ...styles.gridItem,
        backgroundColor: bgColor,
        ...(bgColor !== 'transparent' && styles.gridItemWithBg),
      }}>
      <Box sx={styles.gridItemContent}>{children}</Box>
    </Paper>
  );
};

const GridLayout = () => {
  const { styles } = useStyle();

  return (
    <Box sx={styles.gridContainer}>
      <GridItem />
      <GridItem />
      <GridItem bgColor={SECONDARY_500}>
        <Box sx={styles.gridText}>
          <Typography sx={{ fontSize: '2rem' }}>ERP software</Typography>
        </Box>
      </GridItem>
      <GridItem bgColor={PRIMARY_100}>
        <Box component="img" src={EtendoImg} alt="Logo" sx={styles.gridImage} />
      </GridItem>
      <GridItem bgColor={SECONDARY_100}>
        <Box sx={styles.gridTextYellow}>
          <Typography sx={{ fontSize: '1.5rem' }}>Tailored to suit your needs</Typography>
        </Box>
      </GridItem>
      <GridItem />
      <GridItem bgColor={SECONDARY_100}>
        <Box sx={styles.gridTextYellow}>
          <Typography sx={{ fontSize: '1.5rem' }}>Highly adaptable and scalable</Typography>
        </Box>
      </GridItem>
      <GridItem />
      <GridItem />
    </Box>
  );
};

export default GridLayout;
