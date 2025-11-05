interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_N8N_URL?: string;
  readonly VITE_N8N_API_KEY?: string;
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
