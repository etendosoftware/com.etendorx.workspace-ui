// src/components/index.ts
import { Button as ButtonMUI, Grid as GridMUI, TextField as TextFieldMUI, Box as BoxMUI } from './MUI';
import DataGridCustom from './DataGrid';
import TabCustom from './Tab';
import TableCustom from './Table';
import TableV2Custom from './TableV2';
import ModalCustom from './Modal';
import ApplyHOC from '../utils/applyHOC';
import TextInputMUI from './Input/TextInput/TextInputAutocomplete';
import SearchInputWithVoiceMUI from './Input/TextInput/TextInputAutocomplete/SearchInputWithVoice';
import TextInputBaseMUI from './Input/TextInput/TextInputBase';
import InputPasswordMUI from './Input/TextInput/TextInputBase/InputPassword';
import ToggleChip from './Toggle/ToggleChip';
import DndModal from './DragModal/DragModal';
import Nav from './Nav/Nav';
import ProfileModal from './ProfileModal/ProfileModal';

// ApplyHOC is a higher order component that applies the theme to the component
const Button = ApplyHOC(ButtonMUI);
const Grid = ApplyHOC(GridMUI);
const Box = ApplyHOC(BoxMUI);
const TextField = ApplyHOC(TextFieldMUI);
const DataGrid = ApplyHOC(DataGridCustom);
const Modal = ApplyHOC(ModalCustom);
const Table = ApplyHOC(TableCustom);
const Tab = ApplyHOC(TabCustom);
const TableV2 = ApplyHOC(TableV2Custom);
const TextInput = ApplyHOC(TextInputMUI);
const TextInputBase = ApplyHOC(TextInputBaseMUI);
const InputPassword = ApplyHOC(InputPasswordMUI);
const SearchInputWithVoice = ApplyHOC(SearchInputWithVoiceMUI);
const Chip = ApplyHOC(ToggleChip);
const DragModal = ApplyHOC(DndModal);
const Navbar = ApplyHOC(Nav);
const Profile = ApplyHOC(ProfileModal);

export {
    Button,
    Grid,
    Box,
    TextField,
    DataGrid,
    Tab,
    Table,
    TableV2,
    Modal,
    TextInput,
    TextInputBase,
    InputPassword,
    SearchInputWithVoice,
    Chip,
    DragModal,
    Navbar,
    Profile
};