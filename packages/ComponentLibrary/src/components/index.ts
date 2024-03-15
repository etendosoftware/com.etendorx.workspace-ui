import { Button as ButtonMUI, Grid as GridMUI } from './MUI';
import DataGridCustom from './DataGrid';
import TabCustom from './Tab';
import TableCustom from './Table';
import ApplyHOC from '../utils/applyHOC';

// ApplyHOC is a higher order component that applies the theme to the component
const Button = ApplyHOC(ButtonMUI);
const Grid = ApplyHOC(GridMUI);
const DataGrid = ApplyHOC(DataGridCustom);
const Table = ApplyHOC(TableCustom);
const Tab = ApplyHOC(TabCustom);

export { Button, Grid, DataGrid, Tab, Table };
