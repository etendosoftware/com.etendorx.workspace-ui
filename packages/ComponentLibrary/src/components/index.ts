import { Button as ButtonMUI, Grid as GridMUI } from './MUI';
import DataGridCustom from './DataGrid';
import TabCustom from './Tab';
import TableCustom from './Table';
import TableV2Custom from './TableV2';
import ModalCustom from './Modal';
import ApplyHOC from '../utils/applyHOC';
import ToggleChip from './Toggle/ToggleChip';
import DndModal from './DragModal/DragModal'

// ApplyHOC is a higher order component that applies the theme to the component
const Button = ApplyHOC(ButtonMUI);
const Grid = ApplyHOC(GridMUI);
const DataGrid = ApplyHOC(DataGridCustom);
const Table = ApplyHOC(TableCustom);
const Tab = ApplyHOC(TabCustom);
const TableV2 = ApplyHOC(TableV2Custom);
const Modal = ApplyHOC(ModalCustom);
const Chip = ApplyHOC(ToggleChip);
const DragModal = ApplyHOC(DndModal);

export { Button, Grid, DataGrid, Tab, Table, TableV2, Modal, Chip, DragModal };

