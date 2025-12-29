/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL: string;
  readonly VITE_PORTAL_URL: string;
  readonly VITE_PAYMASTER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
