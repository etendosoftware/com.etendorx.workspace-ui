import {
  Button as ButtonMUI,
  Grid as GridMUI,
  TextField as TextFieldMUI,
  Box as BoxMUI,
} from './MUI';
import DataGridCustom from './DataGrid';
import TabCustom from './Tab';
import TableCustom from './Table';
import TableV2Custom from './TableV2';
import ModalCustom from './Modal';
import TextInputMUI from './Input/TextInput/TextInputAutocomplete';
import SearchInputWithVoiceMUI from './Input/TextInput/TextInputAutocomplete/SearchInputWithVoice';
import TextInputBaseMUI from './Input/TextInput/TextInputBase';
import InputPasswordMUI from './Input/TextInput/TextInputBase/InputPassword';
import ToggleChipMUI from './Toggle/ToggleChip';
import Nav from './Nav/Nav';
import ProfileModal from './ProfileModal/ProfileModal';
import WaterfallModal from './Waterfall/WaterfallModal';
import ConfigurationModalCustom from './ConfigurationModal';
import SelectCustom from './Input/Select';
import NotificationBase from './NotificationsButton';
import NotificationModalCustom from './NotificationsModal';
import TagMUI from './Tag';
import SecondaryTabsMUI from './SecondaryTabs';
import NotificationItemStates from './NotificationItemAllStates';
import DrawerMUI from './Drawer';
import DynamicTableCmp from './DynamicTable';

// ApplyHOC is a higher order component that applies the theme to the component
const Button = ButtonMUI;
const Grid = GridMUI;
const Box = BoxMUI;
const TextField = TextFieldMUI;
const DataGrid = DataGridCustom;
const Modal = ModalCustom;
const Table = TableCustom;
const Tab = TabCustom;
const TableV2 = TableV2Custom;
const TextInput = TextInputMUI;
const TextInputBase = TextInputBaseMUI;
const InputPassword = InputPasswordMUI;
const SearchInputWithVoice = SearchInputWithVoiceMUI;
const ToggleChip = ToggleChipMUI;
const Navbar = Nav;
const Profile = ProfileModal;
const Waterfall = WaterfallModal;
const ConfigurationModal = ConfigurationModalCustom;
const Select = SelectCustom;
const NotificationButton = NotificationBase;
const NotificationModal = NotificationModalCustom;
const Tag = TagMUI;
const SecondaryTabs = SecondaryTabsMUI;
const NotificationStates = NotificationItemStates;
const Drawer = DrawerMUI;
const DynamicTable = DynamicTableCmp;

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
  ToggleChip,
  Navbar,
  Profile,
  Waterfall,
  ConfigurationModal,
  Select,
  NotificationButton,
  NotificationModal,
  Tag,
  SecondaryTabs,
  NotificationStates,
  Drawer,
  DynamicTable,
};
