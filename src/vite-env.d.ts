/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TCG_PUBLIC_FEED_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv { readonly VITE_RETAILER_EDITOR_PREVIEW?: string; }
