/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TCG_PUBLIC_FEED_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
