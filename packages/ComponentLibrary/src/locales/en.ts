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

const en = {
  plural_suffix: "s",
  common: {
    etendo: "Etendo",
    cancel: "Cancel",
    confirm: "Confirm",
    close: "Close",
    closing: "Closing...",
    execute: "Execute",
    register: "Register",
    save: "Save",
    edit: "Edit",
    loading: "Loading...",
    loadingFormData: "Loading form data...",
    loadingWindowContent: "Loading window content...",
    retry: "Retry",
    processes: "Available Process",
    clear: "Clear Selection",
    processTitle: "Title of the process",
    notImplemented: "This feature is not implemented yet",
    loadMore: "Load More",
    trueText: "Yes",
    falseText: "No",
    noDataAvailable: "No data available",
    record: "record",
    records: "records",
    version: "Version: ",
    about: "About",
  },
  forms: {
    sections: {
      main: "Main Section",
      audit: "Audit",
      linkedItems: "Linked Items",
    },
    statusBar: {
      closeRecord: "Close Record",
      nextRecord: "Next Record",
      previousRecord: "Previous Record",
    },
  },
  audit: {
    createdDate: "Creation Date",
    createdBy: "Created By",
    updated: "Updated",
    updatedBy: "Updated By",
  },
  status: {
    deleteSuccess: "has been deleted successfully",
    deleteError: "Error deleting record",
    deleteConfirmation: "Are you sure you want to delete",
    multipleDeleteConfirmation: "Are you sure you want to delete the selected",
    selectRecordError: "Please select a record first",
    saveSuccess: "{{entityType}} has been saved successfully",
    saveError: "Error saving record",
    noIdError: "Cannot delete a record without ID",
    noEntityError: "No entity has been specified",
    httpError: "HTTP Error: ",
    noRecordsError: "There is no records selected",
    noRecords: "Please create a new record",
  },
  errors: {
    tableError: {
      title: "Error",
      description: "Something went wrong",
    },
    networkError: {
      title: "Could not connect to Etendo",
      description: "Looks like there is a network issue or server is down",
    },
    notFound: {
      title: "Not found",
      description: "We couldn't find the page you're looking for",
    },
    internalServerError: {
      title: "Something went wrong",
      retry: "Retry",
    },
    missingRecord: {
      title: "Record Not Found",
      description: "The requested record could not be found",
    },
    missingData: {
      title: "Data Not Found",
      description: "The requested data could not be found",
    },
    missingMetadata: {
      title: "Missing Metadata",
      description: "Required window metadata is not available",
    },
    authentication: {
      message: "Authentication token is not available",
    },
    formData: {
      title: "Error Loading Form",
      description: "There was an error loading the form data",
    },
    adaptingData: {
      title: "Error Processing Data",
      description: "There was an error processing the form data",
    },
    selectionError: {
      title: "No parent record selected",
      description: "Select a record in the parent tab to view related data",
    },
    windowNotFound: {
      title: "Window Not Found",
      description: "The requested window could not be found",
    },
  },
  modal: {
    secondaryButtonLabel: "Back",
  },
  registerModal: {
    descriptionText: "Confirm your shipment and save it in the system. 📝📦",
  },
  table: {
    tooltips: {
      search: "Search",
      views: "Views",
      filter: "Filter",
      columns: "Columns",
      openSidebar: "Open Sidebar",
      closeSidebar: "Close Sidebar",
      details: "Details",
      refresh: "Refresh",
      implicitFilterOn: "Filters applied. Click to remove filters",
      implicitFilterOff: "Filters deactivated. Click to apply filters",
    },
    selection: {
      single: "Element selected",
      multiple: "Elements selected",
    },
    placeholders: {
      search: "Search...",
    },
    labels: {
      noIdentifier: "No item selected",
      noTitle: "No title",
      noType: "No type",
      noRecord: "No Row Selected",
      emptyRecords: "No records to show",
    },
    content: {
      currentTitle: "Its revenue is expected to increase later this year. Congratulations",
    },
    useAsFilter: "Use as filter",
  },
  navigation: {
    common: {
      home: "Home",
      back: "Back",
    },
    waterfall: {
      activateAll: "Activate all",
      deactivateAll: "Deactivate all",
      tooltipButton: "Waterfall Tooltip",
      buttons: "Buttons",
      customize: "Customize",
    },
    configurationModal: {
      tooltipButtonProfile: "Settings",
    },
    activityButton: {
      tooltip: "Activity",
    },
    notificationModal: {
      title: "Notifications",
      markAllAsRead: "Mark all .ault profile",
    },
    profile: {
      tooltipButtonProfile: "Account Settings",
      passwordLabel: "Password",
      newPasswordLabel: "New Password",
      confirmPasswordLabel: "Confirm password",
      signOffTooltip: "Log out",
      saveAsDefault: "Save as default",
    },
  },
  breadcrumb: {
    home: "Home",
    newRecord: "Creating a new Record",
  },
  process: {
    confirmationMessage: "Want to execute this process?",
    messageTitle: "Process",
    completedSuccessfully: "Process completed successfuly",
    processError: "Error while loading process data",
  },
  drawer: {
    recentlyViewed: "Recently Viewed",
  },
  login: {
    title: "Log In",
    subtitle: "Enter your username and password to continue.",
    fields: {
      username: {
        label: "Username",
        placeholder: "Username",
      },
      password: {
        label: "Password",
        placeholder: "Password",
      },
    },
    buttons: {
      submit: "Log In",
      google: "Continue with Google",
    },
    errors: {
      csrfToken: {
        title: "Session expired due to inactivity",
        description: "You have been automatically logged out for security reasons. Please log in again to continue.",
      },
      noAccessTableNoView: {
        title: "No Access to Table",
        description: "You have been automatically logged out for security reasons. Please log in again to continue.",
      },
    },
    or: "OR",
  },
  grid: {
    items: {
      erp: {
        text: "ERP software",
      },
      tailored: {
        text: "Tailored to suit your needs",
      },
      adaptable: {
        text: "Highly scalable",
      },
    },
    alt: {
      logo: "Etendo Logo",
    },
  },
  form: {
    select: {
      placeholder: "Select an option",
    },
  },
  copilot: {
    copilotProfile: "Copilot Profile",
    backToSelection: "Back to assistant selection",
    minimize: "Minimize",
    maximize: "Maximize",
    close: "Close",
    contextText: "Context",
    conversationsButton: "Show History",
    hideConversationsButton: "Hide History",
    assistantSelector: {
      errorInvalidData: "Error: Invalid assistant data",
      errorNoAssistantsAvailable: "No assistants available",
      defaultDescription: "Etendo Copilot Assistant",
      welcomeMessage: "Hello! ✨🚀 Select the profile that best fits your task and let's begin. 💪",
      profilesTitle: "Profiles",
      learnMoreText: "Learn more about Copilot →",
      filterPlaceholder: "Filter profiles...",
    },
    messageInput: {
      placeholder: "Chat with Copilot...",
    },
    messageList: {
      contextRecords: "Selected Context",
      welcomeMessage: "Hello! How can I help you today?",
      typing: "Typing...",
    },
    contextPreview: {
      selectedRegisters: " Attached register",
    },
    conversationList: {
      newConversation: "New Conversation",
      noConversations: "No previous conversations",
      startNewConversation: "Start a new conversation to get started",
      loading: "Loading conversations...",
      untitledConversation: "Untitled Conversation",
      closeSidebar: "Close sidebar",
    },
  },
  location: {
    selector: {
      placeholder: "Select location...",
      modalTitle: "New Location",
      modalDescription: "Enter location details",
      buttons: {
        cancel: "Cancel",
        save: "Save",
        creating: "Creating...",
      },
    },
    fields: {
      address1: {
        label: "Address Line 1",
        placeholder: "Enter address line 1",
      },
      address2: {
        label: "Address Line 2",
        placeholder: "Enter address line 2",
      },
      postal: {
        label: "Postal Code",
        placeholder: "Enter postal code",
      },
      city: {
        label: "City",
        placeholder: "Enter city",
      },
      country: {
        label: "Country",
        placeholder: "Select a country",
      },
      region: {
        label: "Region",
        placeholder: "Select a region",
        selectCountryFirst: "Select a country first",
      },
    },
    errors: {
      loadingCountries: "Error loading countries",
      loadingRegions: "Error loading regions",
      creating: "Error creating location",
      requiredFields: "Please fill in all required fields correctly.",
    },
  },
  primaryTabs: {
    dashboard: "Dashboard",
    closeWindow: "Close Window",
    showTabs: "Show Tabs",
  },
  multiselect: {
    searchPlaceholder: "Search...",
    searchOptions: "Search options",
    clearSelection: "Clear selection",
    noOptionsFound: "No options found",
    loadingOptions: "Loading more options...",
  },
};

export default en;
