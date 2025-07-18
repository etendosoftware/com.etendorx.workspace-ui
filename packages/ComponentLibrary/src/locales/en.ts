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
  },
  forms: {
    sections: {
      main: "Main Section",
      audit: "Audit",
    },
    statusBar: {
      closeRecord: "Close Record",
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
    subtitle: "Enter your credentials to access your account.",
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
    },
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
};

export default en;
