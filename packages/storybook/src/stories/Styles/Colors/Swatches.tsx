import ColorSwatch from './ColorSwatch';
import { Grid, Typography } from '@mui/material';
import { typographyTitleStyles } from './styles';
import { theme } from '../../../../../ComponentLibrary/src/theme';
import { rgbaToHex } from '../../../../../ComponentLibrary/src/utils/colorUtil';

const Swatches = () => {
  const sections = [
    {
      title: 'Dynamic Color',
      colors: [
        { name: 'Main', value: theme.palette.dynamicColor.main },
        { name: 'Dark', value: theme.palette.dynamicColor.dark },
        {
          name: 'Contrast',
          value: theme.palette.dynamicColor.contrastText,
        },
      ],
    },
    {
      title: 'Baseline Color - Neutral',
      colors: Object.entries(theme.palette.baselineColor.neutral).map(
        ([key, value]) => ({ name: `Neutral ${key}`, value }),
      ),
    },
    {
      title: 'Baseline Color - Transparent Neutral',
      colors: Object.entries(
        theme.palette.baselineColor.transparentNeutral,
      ).map(([key, value]) => ({ name: `Transparent Neutral ${key}`, value })),
    },
    {
      title: 'Baseline Color - Etendo Primary',
      colors: [
        { name: 'Main', value: theme.palette.baselineColor.etendoPrimary.main },
        { name: 'Dark', value: theme.palette.baselineColor.etendoPrimary.dark },
        {
          name: 'Contrast',
          value: theme.palette.baselineColor.etendoPrimary.contrastText,
        },
        {
          name: 'Transparent',
          value: theme.palette.baselineColor.etendoPrimary.light,
        },
      ],
    },
    {
      title: 'Specific Colors',
      colors: [
        {
          name: 'Success Main',
          value: theme.palette.specificColor.success.main,
        },
        {
          name: 'Success Light',
          value: theme.palette.specificColor.success.light,
        },
        {
          name: 'Success 5%',
          value: theme.palette.specificColor.success.contrastText,
        },
        {
          name: 'Warning Main',
          value: theme.palette.specificColor.warning.main,
        },
        {
          name: 'Warning Light',
          value: theme.palette.specificColor.warning.light,
        },
        {
          name: 'Warning 5%',
          value: theme.palette.specificColor.warning.contrastText,
        },
        { name: 'Error Main', value: theme.palette.specificColor.error.main },
        {
          name: 'Error Light',
          value: theme.palette.specificColor.error.light,
        },
        {
          name: 'Error 5%',
          value: theme.palette.specificColor.error.contrastText,
        },
        {
          name: 'Draft Main',
          value: theme.palette.specificColor.draft.contrastText,
        },
      ],
    },
  ];

  return (
    <Grid container>
      {sections.map(section => (
        <Grid key={section.title}>
          <Typography variant="h6" style={typographyTitleStyles}>
            {section.title}
          </Typography>
          <Grid container>
            {section.colors.map(color => (
              <Grid item key={color.name}>
                <ColorSwatch
                  colorName={color.name}
                  colorValue={rgbaToHex(color.value)}
                />
              </Grid>
            ))}
          </Grid>
        </Grid>
      ))}
    </Grid>
  );
};

export default Swatches;
