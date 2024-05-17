import { Button as ButtonMUI, Grid as GridMUI } from './MUI';
import DataGridCustom from './DataGrid';
import TabCustom from './Tab';
import TableCustom from './Table';
import TableV2Custom from './TableV2';
import Modal from './Modal';
import ApplyHOC from '../utils/applyHOC';

// ApplyHOC is a higher order component that applies the theme to the component
const Button = ApplyHOC(ButtonMUI);
const Grid = ApplyHOC(GridMUI);
const DataGrid = ApplyHOC(DataGridCustom);
const Table = ApplyHOC(TableCustom);
const Tab = ApplyHOC(TabCustom);
const TableV2 = ApplyHOC(TableV2Custom);
const ModalCustom = ApplyHOC(Modal);

export { Button, Grid, DataGrid, Tab, Table, TableV2, ModalCustom };
