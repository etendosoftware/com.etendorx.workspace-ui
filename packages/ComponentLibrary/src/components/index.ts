// src/components/index.ts
import { Button as ButtonMUI, Grid as GridMUI, TextField as TextFieldMUI } from './MUI';
import DataGridCustom from './DataGrid';
import TabCustom from './Tab';
import TableCustom from './Table';
import TableV2Custom from './TableV2';
import ModalCustom from './Modal';
import ApplyHOC from '../utils/applyHOC';
import TextInputMUI from './TextInput';

// ApplyHOC is a higher order component that applies the theme to the component
const Button = ApplyHOC(ButtonMUI);
const Grid = ApplyHOC(GridMUI);
const TextField = ApplyHOC(TextFieldMUI);
const DataGrid = ApplyHOC(DataGridCustom);
const Modal = ApplyHOC(ModalCustom);
const Table = ApplyHOC(TableCustom);
const Tab = ApplyHOC(TabCustom);
const TableV2 = ApplyHOC(TableV2Custom);
const TextInput = ApplyHOC(TextInputMUI);

export { Button, Grid, TextField, DataGrid, Tab, Table, TableV2, Modal, TextInput };

