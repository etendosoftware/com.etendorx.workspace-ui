const es = {
  common: {
    etendo: 'Etendo',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    close: 'Cerrar',
    execute: 'Ejecutar',
    register: 'Registrar',
    save: 'Guardar',
    edit: 'Editar',
    loading: 'Cargando...',
    loadingFormData: 'Cargando información del formulario...',
  },
  errors: {
    notFound: {
      title: 'Algo salió mal',
      description: 'No pudimos encontrar la página que buscas',
    },
    internalServerError: {
      title: 'Algo salió mal',
      retry: 'Reintentar',
    },
    missingRecord: {
      title: 'Registro no encontrado',
      description: 'El registro solicitado no fue encontrado',
    },
    missingData: {
      title: 'Datos no encontrados',
      description: 'Los datos solicitados no fueron encontrados',
    },
    missingMetadata: {
      title: 'Falta Metadata',
      description: 'La Metadata requerida por la ventana no esta disponible',
    },
    formData: {
      title: 'Error cargando el formulario',
      description: 'Hubo un error cargando la información del formulario',
    },
    adaptingData: {
      title: 'Error procesando la información',
      description: 'Hubo un error procesando la información del formulario',
    },
  },
  modal: {
    secondaryButtonLabel: 'Atrás',
  },
  registerModal: {
    descriptionText: 'Confirma tu envío y guárdalo en el sistema. 📝📦',
  },
  table: {
    tooltips: {
      search: 'Buscar',
      views: 'Vistas',
      filter: 'Filtrar',
      columns: 'Columnas',
      openSidebar: 'Abrir barra lateral',
      closeSidebar: 'Cerrar barra lateral',
      details: 'Detalles',
      refresh: 'Actualizar',
    },
    placeholders: {
      search: 'Buscar...',
    },
    labels: {
      noIdentifier: 'Ningún elemento seleccionado',
      noTitle: 'Sin título',
      noType: 'Sin tipo',
      noRecord: 'Ninguna fila seleccionada',
    },
    content: {
      currentTitle: 'Se espera que sus ingresos aumenten a finales de este año. Felicitaciones',
    },
  },
  navigation: {
    common: {
      home: 'Ir al inicio',
    },
    waterfall: {
      activateAll: 'Activar todo',
      deactivateAll: 'Desactivar todo',
      tooltipButton: 'Tooltip de Cascada',
      buttons: 'Botones',
      customize: 'Personalizar',
    },
    configurationModal: {
      tooltipButtonProfile: 'Configuración',
    },
    activityButton: {
      tooltip: 'Actividad',
    },
    notificationModal: {
      title: 'Notificaciones',
      markAllAsRead: 'Marcar todo como leído',
      emptyStateImageAlt: 'Sin Notificaciones',
      emptyStateMessage: 'No tienes notificaciones',
      emptyStateDescription: '¡Genial! Estás al día con todo. Te notificaremos aquí si hay algo nuevo.',
      actionButtonLabel: 'Configurar notificaciones',
    },
    profile: {
      tooltipButtonProfile: 'Configuración de la cuenta',
      passwordLabel: 'Contraseña',
      newPasswordLabel: 'Nueva Contraseña',
      confirmPasswordLabel: 'Confirmar Nueva Contraseña',
      signOffTooltip: 'Cerrar sesión',
      saveAsDefault: 'Guardar perfil por defecto',
    },
  },
  breadcrumb: {
    home: 'Inicio',
    newRecord: 'Crando un nuevo registro',
  },
  process: {
    confirmationMessage: '¿Deseas ejecutar este proceso?',
  },
};

export default es;
