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
  },
  errors: {
    networkError: {
      title: 'Could not connect to Etendo',
      description: 'Looks like there is a network issue or the server is down',
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
    },
    placeholders: {
      search: 'Search...',
    },
    labels: {
      noIdentifier: 'No item selected',
      noTitle: 'No title',
      noType: 'No type',
      noRecord: 'No Row Selected',
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
  },
  breadcrumb: {
    home: 'Home',
    newRecord: 'Creating a new Record',
  },
  process: {
    confirmationMessage: 'Want to execute this process?',
  },
};

export default en;
