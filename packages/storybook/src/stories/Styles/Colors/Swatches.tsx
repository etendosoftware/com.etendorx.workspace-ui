import ColorSwatch from './ColorSwatch';
import { Grid, Typography } from '@mui/material';
import { typographyTitleStyles } from './styles';
import { theme } from '../../../../../ComponentLibrary/src/theme';

const Swatches = () => {
  const sections = [
    {
      title: 'Dynamic Color',
      colors: [
        { name: 'Main', value: theme.palette.dynamicColor.main },
        { name: 'Dark', value: theme.palette.dynamicColor.dark },
        { name: 'Light', value: theme.palette.dynamicColor.light },
        { name: 'Contrast Text', value: theme.palette.dynamicColor.contrastText }
      ]
    },
    {
      title: 'Baseline Color - Neutral',
      colors: Object.entries(theme.palette.baselineColor.neutral).map(([key, value]) => ({ name: `Neutral ${key}`, value }))
    },
    {
      title: 'Baseline Color - Transparent Neutral',
      colors: Object.entries(theme.palette.baselineColor.transparentNeutral).map(([key, value]) => ({ name: `Transparent Neutral ${key}`, value }))
    },
    {
      title: 'Baseline Color - Etendo Primary',
      colors: [
        { name: 'Main', value: theme.palette.baselineColor.etendoPrimary.main },
        { name: 'Dark', value: theme.palette.baselineColor.etendoPrimary.dark },
        { name: 'Light', value: theme.palette.baselineColor.etendoPrimary.light },
        { name: 'Contrast Text', value: theme.palette.baselineColor.etendoPrimary.contrastText }
      ]
    },
    {
      title: 'Specific Colors',
      colors: [
        { name: 'Success Main', value: theme.palette.specificColor.success.main },
        { name: 'Warning Main', value: theme.palette.specificColor.warning.main },
        { name: 'Error Main', value: theme.palette.specificColor.error.main },
        { name: 'Draft Main', value: theme.palette.specificColor.draft.main }
      ]
    }
  ];

  return (
    <Grid container>
      {sections.map((section) => (
        <Grid key={section.title}>
          <Typography variant="h6" style={typographyTitleStyles}>{section.title}</Typography>
          <Grid container>
            {section.colors.map(color => (
              <Grid item key={color.name}>
                <ColorSwatch colorName={color.name} colorValue={color.value} />
              </Grid>
            ))}
          </Grid>
        </Grid>
      ))}
    </Grid>
  );
};

export default Swatches;
