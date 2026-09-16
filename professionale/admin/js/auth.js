(function () {
  const cfg = window.PROF_ADMIN_CONFIG || {};
  const KEY = cfg.SESSION_KEY || "prof-admin-session-v1";
  const HOURS = Number(cfg.SESSION_HOURS) || 12;
  const HASH = String(cfg.PASSWORD_SHA256 || "").toLowerCase();

  function hex(buf) {
    return Array.from(new Uint8Array(buf))
      .map(function (b) {
        return b.toString(16).padStart(2, "0");
      })
      .join("");
  }

  async function sha256(text) {
    const data = new TextEncoder().encode(String(text));
    const dig = await crypto.subtle.digest("SHA-256", data);
    return hex(dig);
  }

  function readSession() {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.ok || !obj.exp) return null;
      if (Date.now() > Number(obj.exp)) {
        sessionStorage.removeItem(KEY);
        return null;
      }
      return obj;
    } catch (e) {
      return null;
    }
  }

  function writeSession() {
    const exp = Date.now() + HOURS * 60 * 60 * 1000;
    sessionStorage.setItem(KEY, JSON.stringify({ ok: true, exp: exp }));
  }

  function clearSession() {
    sessionStorage.removeItem(KEY);
  }

  function isLoggedIn() {
    return !!readSession();
  }

  async function tryLogin(password) {
    if (!HASH) return false;
    const h = await sha256(password);
    if (h !== HASH) return false;
    writeSession();
    return true;
  }

  window.ProfAdminAuth = {
    isLoggedIn: isLoggedIn,
    tryLogin: tryLogin,
    logout: clearSession,
    require: function () {
      if (isLoggedIn()) return true;
      const here = location.pathname.split("/").pop() || "index.html";
      if (here !== "index.html" && here !== "") {
        location.replace("index.html");
      }
      return false;
    },
  };

  // Login form (solo su index)
  const form = document.getElementById("admin-login");
  if (form) {
    if (isLoggedIn()) {
      location.replace("stats.html");
      return;
    }
    const err = document.getElementById("admin-errore");
    form.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      const input = form.querySelector('input[name="password"]');
      const pwd = input ? input.value : "";
      const ok = await tryLogin(pwd);
      if (ok) {
        location.replace("stats.html");
        return;
      }
      if (err) {
        err.hidden = false;
        err.textContent = "Password non corretta.";
      }
      if (input) {
        input.value = "";
        input.focus();
      }
    });
  }

  const logoutBtn = document.querySelector("[data-admin-logout]");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      clearSession();
      location.replace("index.html");
    });
  }
})();
