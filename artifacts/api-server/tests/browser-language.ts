// Isolated browser fixture: no auth provider, credentials, app initialization or DB.
export function useLanguage() {
  return { t: (_ar: string, en: string) => en };
}
