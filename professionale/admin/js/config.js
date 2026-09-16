/**
 * Config area riservata (statistiche visite).
 *
 * Password di default: rossano-stats
 * Per cambiarla (sul PC del Prof):
 *   printf '%s' 'nuova-password' | sha256sum
 * Incolla l'hash a 64 caratteri in PASSWORD_SHA256 qui sotto (senza spazi).
 *
 * Tracking: Page Views API pubblica (nessuna chiave). Site id = hidetoshi777.github.io
 * Percorsi normalizzati come /Scuola/...
 */
window.PROF_ADMIN_CONFIG = {
  PASSWORD_SHA256:
    "81afa944d0b4192751450cc926a134395edbda76ac2cacb20666c74bd51ec544",
  SESSION_KEY: "prof-admin-session-v1",
  SESSION_HOURS: 12,
};
