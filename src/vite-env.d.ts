/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_LUT_ASSET_BUCKET: string
  readonly VITE_USE_EDGE_DOWNLOADS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
