/**
 * Config area riservata (statistiche visite).
 *
 * Password attuale: Rossano99
 * Per cambiarla (sul PC del Prof):
 *   printf '%s' 'nuova-password' | sha256sum
 * Incolla l'hash a 64 caratteri in PASSWORD_SHA256 qui sotto (senza spazi).
 *
 * Tracking: ultima visita su keyval.org (segnale 24 ore nel pannello admin).
 * Site id Page Views (opzionale, per track) = hidetoshi777.github.io · percorsi /Scuola/...
 */
window.PROF_ADMIN_CONFIG = {
  PASSWORD_SHA256:
    "a83abbfbea94ab5118f3b5ade9c0f2b32c062c4a292d57774924bed3809e6e57",
  SESSION_KEY: "prof-admin-session-v2",
  SESSION_HOURS: 12,
};
