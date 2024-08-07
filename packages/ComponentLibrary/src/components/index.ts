import {
  Button as ButtonMUI,
  Grid as GridMUI,
  TextField as TextFieldMUI,
  Box as BoxMUI,
} from './MUI';
import TableCustom from './Table';
import ModalCustom from './Modal';
import TextInputMUI from './Input/TextInput/TextInputAutocomplete';
import SearchInputWithVoiceMUI, {
  SearchInputWithVoiceProps,
} from './Input/TextInput/TextInputAutocomplete/SearchInputWithVoice';
import TextInputBaseMUI from './Input/TextInput/TextInputBase';
import InputPasswordMUI from './Input/TextInput/TextInputBase/InputPassword';
import ToggleChipMUI from './Toggle/ToggleChip';
import Nav, { NavProps } from './Nav/Nav';
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
import IButton from './IconButton';
import { BoxProps } from '@mui/material';
import DynamicTableCmp from './DynamicTable';
import SpinnerComponent from './Spinner';
import ApplyHOC from '../utils/applyHOC';

export * from '../theme';

// ApplyHOC is a higher order component that applies the theme to the component

const Button = ApplyHOC(ButtonMUI);
const Grid = ApplyHOC(GridMUI);
const Box = ApplyHOC<BoxProps>(BoxMUI);
const TextField = ApplyHOC(TextFieldMUI);
const Modal = ApplyHOC(ModalCustom);
const Table = ApplyHOC(TableCustom);
const TextInput = ApplyHOC(TextInputMUI);
const TextInputBase = ApplyHOC(TextInputBaseMUI);
const InputPassword = ApplyHOC(InputPasswordMUI);
const SearchInputWithVoice = ApplyHOC<SearchInputWithVoiceProps>(
  SearchInputWithVoiceMUI,
);
const ToggleChip = ApplyHOC(ToggleChipMUI);
const Navbar = ApplyHOC<NavProps>(Nav);
const Profile = ApplyHOC(ProfileModal);
const Waterfall = ApplyHOC(WaterfallModal);
const ConfigurationModal = ApplyHOC(ConfigurationModalCustom);
const Select = ApplyHOC(SelectCustom);
const NotificationButton = ApplyHOC(NotificationBase);
const NotificationModal = ApplyHOC(NotificationModalCustom);
const Tag = ApplyHOC(TagMUI);
const SecondaryTabs = ApplyHOC(SecondaryTabsMUI);
const NotificationStates = ApplyHOC(NotificationItemStates);
const Drawer = ApplyHOC(DrawerMUI);
const IconButton = ApplyHOC(IButton);
const DynamicTable = ApplyHOC(DynamicTableCmp);
const Spinner = ApplyHOC(SpinnerComponent);

export {
  Button,
  Grid,
  Box,
  TextField,
  Table,
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
  IconButton,
  DynamicTable,
  Spinner,
};
