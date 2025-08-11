# ProcessModal - Documentación de Referencia

## 📋 Descripción General

El sistema ProcessModal es el componente central para la ejecución de procesos en Etendo WorkspaceUI. Permite la ejecución de dos tipos de procesos: **Process Actions** (ejecutados via iframe) y **Process Definitions** (con configuración de parámetros).

## 🏗️ Arquitectura de Componentes

### Componentes Principales

#### 1. **ProcessDefinitionModal** (`ProcessDefinitionModal.tsx:31`)
Modal principal para procesos de definición que requieren configuración de parámetros.

**Props:**
```typescript
interface ProcessDefinitionModalProps {
  onClose: () => void;
  open: boolean;
  button?: ProcessDefinitionButton | null;
  onSuccess?: () => void;
  onError?: () => void;
}
```

**Funcionalidades:**
- Configuración de parámetros del proceso
- Manejo de referencias a ventanas (Window References)
- Ejecución asíncrona con estados de loading/success/error
- Integración con formularios usando React Hook Form

#### 2. **ProcessIframeModal** (`Iframe.tsx:15`)
Modal para procesos de acción que se ejecutan en iframe.

**Características:**
- Tamaño fijo: 900x625px (heredado de UI anterior)
- Manejo de mensajes entre iframe y aplicación principal
- Estados de loading y procesamiento de mensajes
- Comunicación bidireccional via `postMessage`

#### 3. **WindowReferenceGrid** (`WindowReferenceGrid.tsx:30`)
Componente especializado para mostrar grids de referencias cuando un proceso requiere selección de registros relacionados.

**Funcionalidades:**
- Tabla interactiva con Material React Table
- Selección múltiple de registros
- Filtrado y paginación
- Integración con datasource dinámico

### Componentes de Selección

#### 4. **BaseSelector** (`selectors/BaseSelector.tsx:10`)
Componente base para parámetros de proceso con validación de lógica de solo lectura.

#### 5. **GenericSelector** (`selectors/GenericSelector.tsx:6`)
Selector genérico que renderiza diferentes tipos de input según el tipo de referencia:
- Input de texto para campos básicos
- RadioSelector para listas de opciones

#### 6. **DeprecatedFeatureModal** (`DeprecatedFeature.tsx:9`)
Modal de advertencia para procesos no implementados o deprecados.

## 🔧 Tipos y Interfaces

### Tipos de Procesos

```typescript
// Proceso con configuración de parámetros
interface ProcessDefinitionButton extends BaseProcessButton {
  processDefinition: ProcessDefinition;
}

// Proceso de acción directa
interface ProcessActionButton extends BaseProcessButton {
  processAction: ProcessAction;
}

type ProcessButton = ProcessDefinitionButton | ProcessActionButton;
```

### Respuesta de Procesos

```typescript
interface ProcessResponse {
  responseActions?: Array<{
    showMsgInProcessView?: {
      msgType: string;    // "success" | "error" | "warning"
      msgTitle: string;
      msgText: string;
    };
  }>;
  refreshParent?: boolean;
  showInIframe?: boolean;
  iframeUrl?: string;
}
```

### Parámetros de Proceso

```typescript
interface ProcessDefinition {
  id: string;
  name: string;
  javaClassName: string;
  parameters: ProcessParameters;  // Configuración de campos
  onLoad: string;                // Función de carga
  onProcess: string;             // Función de ejecución
}
```

## 🚀 Flujo de Ejecución

### Para Process Definitions

1. **Apertura del Modal**: Usuario selecciona proceso del menú
2. **Carga de Parámetros**: Ejecuta `onLoad` para obtener configuración inicial
3. **Configuración**: Usuario completa campos requeridos
4. **Validación**: Verifica campos obligatorios y referencias
5. **Ejecución**: Llama a `executeStringFunction` con `onProcess`
6. **Resultado**: Muestra mensaje de éxito/error y actualiza datos

### Para Process Actions

1. **Ejecución Directa**: Se ejecuta inmediatamente al seleccionar
2. **Apertura de Iframe**: Carga la URL del proceso en modal iframe
3. **Procesamiento**: El proceso se ejecuta dentro del iframe
4. **Comunicación**: Maneja mensajes via `postMessage`
5. **Finalización**: Cierra modal y actualiza datos si es necesario

## 🎨 Estilos y Temas

### Estilos Configurables (`styles.ts:4`)

- **Dialog**: Bordes redondeados, padding consistente
- **Botones**: Estilos diferenciados para ejecutar/cancelar
- **Mensajes**: Colores específicos por tipo (success/error/warning)
- **Tabla**: Estilos personalizados para WindowReferenceGrid

### Variables CSS Utilizadas

```css
--color-etendo-main        /* Color principal de botones */
--color-success-main       /* Mensajes de éxito */
--color-error-main         /* Mensajes de error */
--color-baseline-*         /* Colores de base del sistema */
```

## 🔍 Funciones Clave

### Ejecución de Procesos (`ProcessDefinitionModal.tsx:151`)

```typescript
const handleExecute = async () => {
  if (hasWindowReference) {
    await handleWindowReferenceExecute();
    return;
  }
  
  const result = await executeStringFunction(onProcess, { Metadata }, 
    button.processDefinition, {
      buttonValue: "DONE",
      windowId: tab.window,
      entityName: tab.entityName,
      recordIds: selectedRecords?.map((r) => r.id),
      ...form.getValues(),
    });
};
```

### Manejo de Window References (`ProcessDefinitionModal.tsx:86`)

```typescript
const handleWindowReferenceExecute = async () => {
  const payload = {
    [currentAttrs.inpColumnId]: currentRecordValue,
    [currentAttrs.inpPrimaryKeyColumnId]: currentRecordValue,
    _buttonValue: "DONE",
    _params: {
      grid: {
        _selection: gridSelection,  // Registros seleccionados
      },
    },
    _entityName: entityName,
  };
  
  const response = await Metadata.kernelClient.post(`?${params}`, payload);
};
```

## 🛠️ Integración con el Sistema

### Hooks Utilizados

- **useProcessExecution**: Lógica de ejecución de procesos
- **useProcessButton**: Manejo de clicks en botones
- **useDatasource**: Carga de datos para grids
- **useForm** (React Hook Form): Manejo de formularios

### Contextos Requeridos

- **TabContext**: Información de la pestaña actual
- **UserContext**: Sesión y permisos del usuario
- **MetadataContext**: Metadatos de ventanas y campos

### Comunicación con Backend

- **Metadata.kernelClient**: Cliente para procesos de definición
- **API_FORWARD_PATH**: Ruta para procesos de acción
- **SSE (Server-Sent Events)**: Para mensajes en tiempo real

## 🧪 Testing

### Archivos de Test

- `__tests__/components/ProcessModal/iframe.test.tsx`
- Mocks en `__mocks__/` para dependencias externas

### Casos de Prueba Recomendados

1. **Apertura/Cierre de Modales**
2. **Validación de Parámetros Obligatorios**
3. **Ejecución Exitosa de Procesos**
4. **Manejo de Errores**
5. **Selección en Window References**

## ⚠️ Consideraciones Importantes

### Seguridad

- Validación de parámetros antes de envío
- Sanitización de HTML en mensajes de respuesta
- Verificación de permisos en display logic

### Performance

- Lazy loading de datos en grids
- Paginación con `fetchMore` en tablas grandes
- Debounce en filtros de búsqueda

### Accesibilidad

- Soporte para navegación por teclado
- Etiquetas ARIA apropiadas
- Indicadores visuales de campos obligatorios

## 🔧 Personalización

### Extensión de Selectores

Para agregar nuevos tipos de selectores:

1. Crear componente en `selectors/`
2. Registrar en `GenericSelector.tsx`
3. Definir tipo de referencia correspondiente

### Nuevos Tipos de Proceso

Para agregar tipos de proceso:

1. Extender interfaces en `types.ts`
2. Implementar lógica en `useProcessExecution`
3. Actualizar type guards (`isProcessActionButton`, `isProcessDefinitionButton`)

## 📚 Referencias

- **Material React Table**: Para componentes de tabla
- **React Hook Form**: Para manejo de formularios
- **Framer Motion**: Para animaciones (si se utiliza)
- **Material-UI**: Para componentes base de UI

---

Este documento cubre la funcionalidad completa del sistema ProcessModal. Para implementaciones específicas o debugging, consultar los archivos fuente correspondientes en `packages/MainUI/components/ProcessModal/`.