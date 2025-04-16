const en = {
  common: {
    etendo: 'Etendo',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    execute: 'Execute',
    register: 'Register',
    save: 'Save',
    edit: 'Edit',
    loading: 'Loading...',
    loadingFormData: 'Loading form data...',
    retry: 'Retry',
    processes: 'Available Process',
    clear: 'Clear Selection',
  },
  forms: {
    sections: {
      main: 'Main Section',
    },
  },
  status: {
    deleteSuccess: 'has been deleted successfully',
    deleteError: 'Error deleting record',
    deleteConfirmation: 'Are you sure you want to delete',
    multipleDeleteConfirmation: 'Are you sure you want to delete the selected records?',
    selectRecordError: 'Please select a record first',
    saveSuccess: '{{entityType}} has been saved successfully',
    saveError: 'Error saving record',
    noIdError: 'Cannot delete a record without ID',
    noEntityError: 'No entity has been specified',
    httpError: 'HTTP Error: ',
    noRecordsError: 'There is no records selected',
    noRecords: 'Please create a new record',
  },
  errors: {
    networkError: {
      title: 'Could not connect to Etendo',
      description: 'Looks like there is a network issue or rver is down',
    },
    notFound: {
      title: 'Not found',
      description: "We couldn't find the page you're looking for",
    },
    internalServerError: {
      title: 'Something went wrong',
      retry: 'Retry',
    },
    missingRecord: {
      title: 'Record Not Found',
      description: 'The requested record could not be found',
    },
    missingData: {
      title: 'Data Not Found',
      description: 'The requested data could not be found',
    },
    missingMetadata: {
      title: 'Missing Metadata',
      description: 'Required window metadata is not available',
    },
    formData: {
      title: 'Error Loading Form',
      description: 'There was an error loading the form data',
    },
    adaptingData: {
      title: 'Error Processing Data',
      description: 'There was an error processing the form data',
    },
  },
  modal: {
    secondaryButtonLabel: 'Back',
  },
  registerModal: {
    descriptionText: 'Confirm your shipment and save it in the system. 📝📦',
  },
  table: {
    tooltips: {
      search: 'Search',
      views: 'Views',
      filter: 'Filter',
      columns: 'Columns',
      openSidebar: 'Open Sidebar',
      closeSidebar: 'Close Sidebar',
      details: 'Details',
      refresh: 'Refresh',
      implicitFilterOn: 'Filters applied. Click to remove filters',
      implicitFilterOff: 'Filters deactivated. Click to apply filters',
    },
    selection: {
      single: 'Element selected',
      multiple: 'Elements selected',
    },
    placeholders: {
      search: 'Search...',
    },
    labels: {
      noIdentifier: 'No item selected',
      noTitle: 'No title',
      noType: 'No type',
      noRecord: 'No Row Selected',
      emptyRecords: 'No records to show',
    },
    content: {
      currentTitle: 'Its revenue is expected to increase later this year. Congratulations',
    },
  },
  navigation: {
    common: {
      home: 'Home',
    },
    waterfall: {
      activateAll: 'Activate all',
      deactivateAll: 'Deactivate all',
      tooltipButton: 'Waterfall Tooltip',
      buttons: 'Buttons',
      customize: 'Customize',
    },
    configurationModal: {
      tooltipButtonProfile: 'Settings',
    },
    activityButton: {
      tooltip: 'Activity',
    },
    notificationModal: {
      title: 'Notifications',
      markAllAsRead: 'Mark all .ault profile',
    },
    profile: {
      tooltipButtonProfile: 'Account Settings',
      passwordLabel: 'Password',
      newPasswordLabel: 'New Password',
      confirmPasswordLabel: 'Confirm password',
      signOffTooltip: 'Log out',
      saveAsDefault: 'Save as default',
    },
  },
  breadcrumb: {
    home: 'Home',
    newRecord: 'Creating a new Record',
  },
  process: {
    confirmationMessage: 'Want to execute this process?',
    messageTitle: 'Process',
    completedSuccessfully: 'Process completed successfuly',
  },
  drawer: {
    recentlyViewed: 'Recently Viewed',
  },
  login: {
    subtitle: 'Enter your credentials to access your account.',
    fields: {
      username: {
        label: 'Username',
        placeholder: 'Username',
      },
      password: {
        label: 'Password',
        placeholder: 'Password',
      },
    },
    buttons: {
      submit: 'Log In',
    },
  },
  grid: {
    items: {
      erp: {
        text: 'ERP software',
      },
      tailored: {
        text: 'Tailored to suit your needs',
      },
      adaptable: {
        text: 'Highly scalable',
      },
    },
    alt: {
      logo: 'Etendo Logo',
    },
  },
  form: {
    select: {
      placeholder: 'Select an option',
    },
  },
};

export default en;
