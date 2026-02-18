/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JAVA_RUNTIME_API?: string;
  readonly VITE_DEVCONTAINER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
