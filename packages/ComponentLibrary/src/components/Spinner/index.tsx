import Box from '@mui/material/Box';
import CircularProgress, { type CircularProgressProps } from '@mui/material/CircularProgress';

export default function Spinner(props: CircularProgressProps) {
  return (
    <Box justifyContent='center' alignItems='center' display='flex' flex={1}>
      <CircularProgress {...props} />
    </Box>
  );
}
