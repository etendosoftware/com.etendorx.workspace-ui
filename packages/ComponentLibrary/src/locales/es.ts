const es = {
  common: {
    etendo: "Etendo",
    cancel: "Cancelar",
    confirm: "Confirmar",
    close: "Cerrar",
    closing: "Cerrando...",
    execute: "Ejecutar",
    register: "Registrar",
    save: "Guardar",
    edit: "Editar",
    loading: "Cargando...",
    loadingFormData: "Cargando información del formulario...",
    loadingWindowContent: "Cargando contenido de la ventana...",
    retry: "Reintentar",
    processes: "Procesos disponibles",
    clear: "Limpiar Seleccion",
    processTitle: "Titulo del proceso",
    notImplemented: "Esta funcionalidad no está disponible aun",
    loadMore: "Cargar más",
    trueText: "Si",
    falseText: "No",
    noDataAvailable: "No hay información disponible",
    record: "registro",
    records: "registros",
  },
  forms: {
    sections: {
      main: "Sección Principal",
      audit: "Auditoría",
    },
    statusBar: {
      closeRecord: "Cerrar registro",
    },
  },
  audit: {
    createdDate: "Fecha de creación",
    createdBy: "Creado por",
    updated: "Actualizado",
    updatedBy: "Actualizado por",
  },
  status: {
    deleteSuccess: "ha sido eliminado correctamente",
    deleteError: "Error al eliminar el registro",
    deleteConfirmation: "¿Estás seguro de que quieres eliminar",
    multipleDeleteConfirmation: "¿Estás seguro de que quieres eliminar los registros seleccionados?",
    selectRecordError: "Por favor, selecciona un registro primero",
    saveSuccess: "{{entityType}} ha sido guardado correctamente",
    saveError: "Error al guardar el registro",
    noIdError: "No se puede borrar un registro sin identificador",
    noEntityError: "No hay una entidad especificada",
    httpError: "Error HTTP: ",
    noRecordsError: "No hay registros seleccionados",
    noRecords: "Por favor, crea un nuevo registro",
  },
  errors: {
    tableError: {
      title: "Error",
      description: "Algo salió mal",
    },
    networkError: {
      title: "No se pudo conectar con Etendo",
      description: "Parece que hay algún problema en la red o el servidor está caído",
    },
    notFound: {
      title: "Algo salió mal",
      description: "No pudimos encontrar la página que buscas",
    },
    internalServerError: {
      title: "Algo salió mal",
      retry: "Reintentar",
    },
    missingRecord: {
      title: "Registro no encontrado",
      description: "El registro solicitado no fue encontrado",
    },
    missingData: {
      title: "Datos no encontrados",
      description: "Los datos solicitados no fueron encontrados",
    },
    missingMetadata: {
      title: "Falta Metadata",
      description: "La Metadata requerida por la ventana no esta disponible",
    },
    formData: {
      title: "Error cargando el formulario",
      description: "Hubo un error cargando la información del formulario",
    },
    adaptingData: {
      title: "Error procesando la información",
      description: "Hubo un error procesando la información del formulario",
    },
    selectionError: {
      title: "No hay registro superior seleccionado.",
      description: "Selecciona un registro en la pestaña principal para ver la información relacionada.",
    },
    windowNotFound: {
      title: "Ventana no encontrada",
      description: "La ventana solicitada no fue encontrada",
    },
  },
  modal: {
    secondaryButtonLabel: "Atrás",
  },
  registerModal: {
    descriptionText: "Confirma tu envío y guárdalo en el sistema. 📝📦",
  },
  table: {
    tooltips: {
      search: "Buscar",
      views: "Vistas",
      filter: "Filtrar",
      columns: "Columnas",
      openSidebar: "Abrir barra lateral",
      closeSidebar: "Cerrar barra lateral",
      details: "Detalles",
      refresh: "Actualizar",
      implicitFilterOn: "Filtros aplicados. Click para quitar filtros",
      implicitFilterOff: "Filtros desactivados. Click para aplicar filtros",
    },
    selection: {
      single: "Elemento selecccionado",
      multiple: "Elementos seleccionados",
    },
    placeholders: {
      search: "Buscar...",
    },
    labels: {
      noIdentifier: "Ningún elemento seleccionado",
      noTitle: "Sin título",
      noType: "Sin tipo",
      noRecord: "Ninguna fila seleccionada",
      emptyRecords: "No hay registros para mostrar",
    },
    content: {
      currentTitle: "Se espera que sus ingresos aumenten a finales de este año. Felicitaciones",
    },
  },
  navigation: {
    common: {
      home: "Ir al inicio",
      back: "Atrás",
    },
    waterfall: {
      activateAll: "Activar todo",
      deactivateAll: "Desactivar todo",
      tooltipButton: "Tooltip de Cascada",
      buttons: "Botones",
      customize: "Personalizar",
    },
    configurationModal: {
      tooltipButtonProfile: "Configuración",
    },
    activityButton: {
      tooltip: "Actividad",
    },
    notificationModal: {
      title: "Notificaciones",
      markAllAsRead: "Marcar todo como leído",
      emptyStateImageAlt: "Sin Notificaciones",
      emptyStateMessage: "No tienes notificaciones",
      emptyStateDescription: "¡Genial! Estás al día con todo. Te notificaremos aquí si hay algo nuevo.",
      actionButtonLabel: "Configurar notificaciones",
    },
    profile: {
      tooltipButtonProfile: "Configuración de la cuenta",
      passwordLabel: "Contraseña",
      newPasswordLabel: "Nueva Contraseña",
      confirmPasswordLabel: "Confirmar Nueva Contraseña",
      signOffTooltip: "Cerrar sesión",
      saveAsDefault: "Guardar perfil por defecto",
    },
  },
  breadcrumb: {
    home: "Inicio",
    newRecord: "Crando un nuevo registro",
  },
  process: {
    confirmationMessage: "¿Deseas ejecutar este proceso?",
    messageTitle: "Proceso",
    completedSuccessfully: "Proceso completado exítosamente",
    processError: "Error mientras se cargaba la informacion del proceso",
  },
  drawer: {
    recentlyViewed: "Visto recientemente",
  },
  login: {
    subtitle: "Ingrese sus credenciales para acceder a su cuenta",
    fields: {
      username: {
        label: "Usuario",
        placeholder: "Usuario",
      },
      password: {
        label: "Contraseña",
        placeholder: "Contraseña",
      },
    },
    buttons: {
      submit: "Acceso",
    },
  },
  grid: {
    items: {
      erp: {
        text: "ERP software",
      },
      tailored: {
        text: "Adaptado a sus necesidades",
      },
      adaptable: {
        text: "Altamente escalable",
      },
    },
    alt: {
      logo: "Etendo Logo",
    },
  },
  form: {
    select: {
      placeholder: "Seleccione una opción",
    },
  },
  location: {
    selector: {
      placeholder: "Seleccionar ubicación...",
      modalTitle: "Nueva Ubicación",
      modalDescription: "Ingrese los detalles de la ubicación",
      buttons: {
        cancel: "Cancelar",
        save: "Guardar",
        creating: "Creando...",
      },
    },
    fields: {
      address1: {
        label: "Dirección Línea 1",
        placeholder: "Ingrese la dirección línea 1",
      },
      address2: {
        label: "Dirección Línea 2",
        placeholder: "Ingrese la dirección línea 2",
      },
      postal: {
        label: "Código Postal",
        placeholder: "Ingrese el código postal",
      },
      city: {
        label: "Ciudad",
        placeholder: "Ingrese la ciudad",
      },
      country: {
        label: "País",
        placeholder: "Seleccione un país",
      },
      region: {
        label: "Región",
        placeholder: "Seleccione una región",
        selectCountryFirst: "Seleccione un país primero",
      },
    },
    errors: {
      loadingCountries: "Error cargando países",
      loadingRegions: "Error cargando regiones",
      creating: "Error creando ubicación",
      requiredFields: "Por favor complete todos los campos requeridos correctamente.",
    },
  },
};

export default es;
