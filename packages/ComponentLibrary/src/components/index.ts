/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import ModalCustom from "./BasicModal";
import TextInputMUI from "./Input/TextInput/TextInputAutocomplete";
import SearchInputWithVoiceMUI from "./Input/TextInput/TextInputAutocomplete/SearchInputWithVoice";
import TextInputBaseMUI from "./Input/TextInput/TextInputBase";
import InputPasswordMUI from "./Input/TextInput/TextInputBase/InputPassword";
import ToggleChipMUI from "./Toggle/ToggleChip";
import Nav from "./Nav/Nav";
import WaterfallModal from "./Waterfall/WaterfallModal";
import ConfigurationModalCustom from "./ConfigurationModal";
import NotificationBase from "./NotificationsButton";
import NotificationModalCustom from "./NotificationsModal";
import TagMUI from "./Tag";
import SecondaryTabsMUI from "./SecondaryTabs";
import NotificationItemStates from "./NotificationItemAllStates";
import DrawerMUI from "./Drawer";
import IconButtonCustom from "./IconButton";
import CopilotButtonCustom from "./Copilot/CopilotButton";
import CopilotPopupCustom from "./Copilot/CopilotPopup";
import RadioGridCustom from "./RadioGrid";
import AboutButtonComp from "./About/AboutButton";
import AboutModalComp from "./About/AboutModal";
import LinkedItemsCustom from "./LinkedItems";

const Modal = ModalCustom;
const TextInput = TextInputMUI;
const TextInputBase = TextInputBaseMUI;
const InputPassword = InputPasswordMUI;
const SearchInputWithVoice = SearchInputWithVoiceMUI;
const ToggleChip = ToggleChipMUI;
const Navbar = Nav;
const Waterfall = WaterfallModal;
const ConfigurationModal = ConfigurationModalCustom;
const NotificationButton = NotificationBase;
const NotificationModal = NotificationModalCustom;
const Tag = TagMUI;
const SecondaryTabs = SecondaryTabsMUI;
const NotificationStates = NotificationItemStates;
const Drawer = DrawerMUI;
const IconButton = IconButtonCustom;
const CopilotButton = CopilotButtonCustom;
const CopilotPopup = CopilotPopupCustom;
const RadioGrid = RadioGridCustom;
const AboutButton = AboutButtonComp;
const AboutModal = AboutModalComp;
const LinkedItems = LinkedItemsCustom;

export {
  Modal,
  TextInput,
  TextInputBase,
  InputPassword,
  SearchInputWithVoice,
  ToggleChip,
  Navbar,
  Waterfall,
  ConfigurationModal,
  NotificationButton,
  NotificationModal,
  Tag,
  SecondaryTabs,
  NotificationStates,
  Drawer,
  IconButton,
  CopilotButton,
  CopilotPopup,
  RadioGrid,
  AboutButton,
  AboutModal,
  LinkedItems,
};

// Export Copilot constants from api-client
export { MESSAGE_ROLES, CONTEXT_CONSTANTS } from "@workspaceui/api-client/src/api/copilot";
export type { MessageRole } from "@workspaceui/api-client/src/api/copilot";
