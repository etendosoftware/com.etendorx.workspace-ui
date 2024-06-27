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
import ApplyHOC from '../utils/applyHOC';
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
const ToggleChip = ApplyHOC(ToggleChipMUI);
const Navbar = ApplyHOC(Nav);
const Profile = ApplyHOC(ProfileModal);
const Waterfall = ApplyHOC(WaterfallModal);
const ConfigurationModal = ApplyHOC(ConfigurationModalCustom);
const Select = ApplyHOC(SelectCustom);
const NotificationButton = ApplyHOC(NotificationBase);
const NotificationModal = ApplyHOC(NotificationModalCustom);
const Tag = ApplyHOC(TagMUI);
const SecondaryTabs = ApplyHOC(SecondaryTabsMUI);
const NotificationStates = ApplyHOC(NotificationItemStates);

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
};
