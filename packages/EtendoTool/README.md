# EtendoTool (modo desarrollo)

SPA React (sin Next) que reutiliza `@workspaceui/componentlibrary` para un wizard de dev:
- Paso 1: requisitos de sistema (chequea Java 17 via init-web).
- Paso 2: modo ejecucion (ejecuta/valida comandos Java contra init-web).

## Ejecutar

- Desarrollo: `pnpm dev:etendotool`
- Build: `pnpm build:etendotool`

## Configuracion de API

Define `VITE_JAVA_RUNTIME_API` para apuntar a la API REST (por defecto `/api`, proxied a `http://localhost:3851` con Vite). Se esperan estos endpoints:

- `GET {base}/check?command=java` -> `{ command: string, available: boolean }`
- `POST {base}/execute` body `{ command: "java", args: {} }` -> `{ success: boolean, output: string, error?: string }`

La UI muestra el estado, permite reintentar la verificacion y ejecutar el comando Java en modo desarrollo.
