/* Icone dei posti della città: un unico sprite SVG iniettato nella pagina.
   Uso: <svg class="ico-posto"><use href="#ic-pharmacy"/></svg>
   viewBox 0 0 64 64, colori fissi (sono illustrazioni, uguali nei due temi). */
(function () {
  const porta = '<rect x="27" y="44" width="10" height="14" rx="1.5" fill="#6b4a2f"/>';
  const terra = '<rect x="4" y="57" width="56" height="3" rx="1.5" fill="#00000033"/>';
  const fin = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w || 7}" height="${h || 7}" rx="1" fill="${c || "#9fd3f0"}"/>`;

  const ICONE = {
    pharmacy: `${terra}
      <rect x="9" y="20" width="46" height="38" rx="3" fill="#e6f4ea"/>
      <rect x="7" y="16" width="50" height="7" rx="2" fill="#1f9d55"/>
      <circle cx="32" cy="34" r="9" fill="#1f9d55"/>
      <rect x="29.5" y="28" width="5" height="12" fill="#fff"/><rect x="26" y="31.5" width="12" height="5" fill="#fff"/>
      ${fin(13, 28)}${fin(44, 28)}<rect x="27" y="46" width="10" height="12" rx="1.5" fill="#9fd3f0"/>`,

    church: `${terra}
      <path d="M8 34 L22 24 L22 58 L8 58 Z" fill="#e9dcc3"/>
      <rect x="8" y="34" width="48" height="24" fill="#efe4cf"/>
      <path d="M6 36 L32 22 L58 36 Z" fill="#b5653e"/>
      <rect x="25" y="14" width="14" height="44" fill="#e3d3b4"/>
      <path d="M23 16 L32 3 L41 16 Z" fill="#8a4b2f"/>
      <rect x="31" y="0" width="2" height="6" fill="#d9a400"/><rect x="29" y="1.5" width="6" height="2" fill="#d9a400"/>
      <circle cx="32" cy="25" r="3.2" fill="#9fd3f0"/>
      <path d="M27 58 L27 48 Q32 41 37 48 L37 58 Z" fill="#6b4a2f"/>
      ${fin(12, 42, 5, 8)}${fin(47, 42, 5, 8)}`,

    hospital: `${terra}
      <rect x="6" y="18" width="52" height="40" rx="3" fill="#f4f6f8"/>
      <rect x="22" y="8" width="20" height="16" rx="2" fill="#1d5fb4"/>
      <text x="32" y="21.5" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="14" fill="#fff">H</text>
      ${fin(10, 28)}${fin(19, 28)}${fin(38, 28)}${fin(47, 28)}${fin(10, 39)}${fin(47, 39)}
      <rect x="25" y="36" width="14" height="5" fill="#e03b3b"/><rect x="29.5" y="31.5" width="5" height="14" fill="#e03b3b"/>
      <rect x="26" y="48" width="12" height="10" rx="1" fill="#9fd3f0"/>`,

    bank: `${terra}
      <rect x="8" y="24" width="48" height="34" rx="2" fill="#dfe6ee"/>
      <rect x="6" y="18" width="52" height="8" rx="2" fill="#2d4b73"/>
      <circle cx="32" cy="38" r="11" fill="#e8b830" stroke="#b8860b" stroke-width="2"/>
      <text x="32" y="43.5" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="15" fill="#7a5600">€</text>
      ${fin(11, 31, 8, 10)}${fin(45, 31, 8, 10)}
      <rect x="10" y="50" width="12" height="8" rx="1" fill="#2d4b73"/><rect x="12" y="52" width="8" height="2.5" fill="#7fe0a8"/>
      <rect x="27" y="50" width="10" height="8" fill="#6b4a2f"/>`,

    school: `${terra}
      <rect x="8" y="28" width="48" height="30" fill="#d4664a"/>
      <path d="M5 30 L32 14 L59 30 Z" fill="#5d6873"/>
      <rect x="28" y="6" width="8" height="10" fill="#d4664a"/>
      <path d="M26 7 L32 2 L38 7 Z" fill="#5d6873"/>
      <circle cx="32" cy="24" r="4.5" fill="#fff"/><path d="M32 21.5 V24 H34" stroke="#333" stroke-width="1.2" fill="none"/>
      ${fin(12, 34, 8, 8)}${fin(44, 34, 8, 8)}${fin(12, 46, 8, 8)}${fin(44, 46, 8, 8)}
      ${porta}
      <rect x="23" y="34" width="18" height="7" rx="1" fill="#fff"/>
      <text x="32" y="39.6" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="5.6" fill="#d4664a">ABC</text>`,

    park: `${terra}
      <rect x="4" y="44" width="56" height="14" rx="4" fill="#7cc36b"/>
      <rect x="15" y="30" width="4" height="18" fill="#7b5332"/><circle cx="17" cy="24" r="12" fill="#2f9e44"/><circle cx="12" cy="20" r="6" fill="#40b856"/>
      <rect x="43" y="34" width="4" height="14" fill="#7b5332"/><circle cx="45" cy="28" r="10" fill="#37a34c"/>
      <rect x="25" y="46" width="16" height="3" rx="1" fill="#8a5a33"/><rect x="25" y="42" width="16" height="2.5" rx="1" fill="#8a5a33"/>
      <rect x="27" y="49" width="2" height="5" fill="#5a3a20"/><rect x="37" y="49" width="2" height="5" fill="#5a3a20"/>
      <circle cx="52" cy="52" r="2" fill="#ffd43b"/><circle cx="9" cy="53" r="2" fill="#ff8fab"/>`,

    cinema: `${terra}
      <rect x="8" y="22" width="48" height="36" rx="2" fill="#4b2a6b"/>
      <rect x="6" y="14" width="52" height="12" rx="2" fill="#2a1840"/>
      ${[10, 17, 24, 31, 38, 45, 52].map((x) => `<circle cx="${x}" cy="20" r="1.8" fill="#ffd43b"/>`).join("")}
      <rect x="18" y="29" width="28" height="13" rx="1" fill="#fff"/>
      <rect x="20" y="31" width="7" height="9" fill="#e03b3b"/><rect x="28.5" y="31" width="7" height="9" fill="#1d5fb4"/><rect x="37" y="31" width="7" height="9" fill="#2f9e44"/>
      <path d="M26 58 L26 47 L38 47 L38 58 Z" fill="#9fd3f0"/>
      <path d="M11 50 L15 44 L19 50 Z" fill="#ffd43b"/><path d="M45 50 L49 44 L53 50 Z" fill="#ffd43b"/>`,

    postoffice: `${terra}
      <rect x="8" y="22" width="48" height="36" rx="2" fill="#f6efe2"/>
      <rect x="6" y="16" width="52" height="8" rx="2" fill="#d9302c"/>
      <rect x="18" y="28" width="22" height="15" rx="1.5" fill="#fff" stroke="#d9302c" stroke-width="1.6"/>
      <path d="M18.5 28.5 L29 37 L39.5 28.5" fill="none" stroke="#d9302c" stroke-width="1.8"/>
      <rect x="44" y="34" width="9" height="20" rx="4" fill="#d9302c"/><rect x="45.5" y="39" width="6" height="1.6" fill="#2a2a2a"/><rect x="43" y="54" width="11" height="3" fill="#2a2a2a"/>
      <rect x="20" y="46" width="11" height="12" rx="1" fill="#6b4a2f"/>${fin(10, 30, 5, 8)}`,

    supermarket: `${terra}
      <rect x="5" y="24" width="54" height="34" rx="2" fill="#eef3f7"/>
      ${[5, 14, 23, 32, 41, 50].map((x, i) => `<rect x="${x}" y="17" width="9" height="9" fill="${i % 2 ? "#fff" : "#f08c00"}"/>`).join("")}
      <path d="M5 26 ${[5, 14, 23, 32, 41, 50].map((x) => `Q ${x + 4.5} 31 ${x + 9} 26`).join(" ")}" fill="#f08c00"/>
      <path d="M17 34 H22 L26 45 H40 L43 37 H24" fill="none" stroke="#1d5fb4" stroke-width="2.4" stroke-linejoin="round"/>
      <circle cx="27.5" cy="49" r="2.4" fill="#1d5fb4"/><circle cx="38.5" cy="49" r="2.4" fill="#1d5fb4"/>
      <rect x="46" y="36" width="10" height="22" fill="#9fd3f0"/><rect x="8" y="36" width="7" height="22" fill="#9fd3f0"/>`,

    restaurant: `${terra}
      <rect x="8" y="24" width="48" height="34" rx="2" fill="#f3e3cf"/>
      ${[6, 14, 22, 30, 38, 46].map((x, i) => `<rect x="${x}" y="17" width="8" height="9" fill="${i % 2 ? "#fff" : "#c92a2a"}"/>`).join("")}<rect x="54" y="17" width="4" height="9" fill="#c92a2a"/>
      <circle cx="32" cy="37" r="8.5" fill="#fff" stroke="#adb5bd" stroke-width="1.5"/>
      <path d="M19 30 V44 M17 30 V35 Q19 37 21 35 V30" fill="none" stroke="#495057" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M45 30 Q48 33 45 38 V44" fill="none" stroke="#495057" stroke-width="2" stroke-linecap="round"/>
      ${porta}${fin(11, 46, 9, 8)}${fin(44, 46, 9, 8)}`,

    cafe: `${terra}
      <rect x="9" y="24" width="46" height="34" rx="2" fill="#efe1d1"/>
      <path d="M7 18 H57 L54 27 H10 Z" fill="#7a4b2a"/>
      <path d="M21 33 H39 V42 Q39 48 33 48 H27 Q21 48 21 42 Z" fill="#fff"/>
      <path d="M39 35 Q45 35 44 40 Q43 43 39 43" fill="none" stroke="#fff" stroke-width="2.4"/>
      <path d="M26 30 Q24 27 26 24 M31 30 Q29 27 31 24 M36 30 Q34 27 36 24" fill="none" stroke="#a0704a" stroke-width="1.4" stroke-linecap="round"/>
      <rect x="26" y="37" width="8" height="5" rx="1" fill="#7a4b2a"/>
      <rect x="12" y="49" width="10" height="9" fill="#9fd3f0"/><rect x="42" y="49" width="10" height="9" fill="#9fd3f0"/><rect x="27" y="49" width="10" height="9" fill="#6b4a2f"/>`,

    hotel: `${terra}
      <rect x="12" y="8" width="40" height="50" rx="2" fill="#5c7cba"/>
      <rect x="10" y="5" width="44" height="6" rx="2" fill="#344e86"/>
      ${[16, 25, 34, 43].map((x) => [15, 25].map((y) => fin(x, y, 6, 6, "#ffe8a3")).join("")).join("")}
      <rect x="16" y="34" width="32" height="12" rx="2" fill="#fff"/>
      <rect x="20" y="39" width="24" height="4" fill="#e8590c"/><rect x="20" y="37" width="6" height="3" rx="1.2" fill="#ffd8a8"/><rect x="19" y="36" width="2" height="9" fill="#495057"/><rect x="43" y="39" width="2" height="6" fill="#495057"/>
      <rect x="26" y="48" width="12" height="10" fill="#9fd3f0"/>`,

    station: `${terra}
      <rect x="4" y="28" width="56" height="30" rx="2" fill="#e8e0d0"/>
      <path d="M2 30 Q32 12 62 30 Z" fill="#6c757d"/>
      <circle cx="32" cy="25" r="4" fill="#fff"/><path d="M32 23 V25 H33.5" stroke="#333" stroke-width="1" fill="none"/>
      <rect x="20" y="33" width="24" height="22" rx="5" fill="#2b8a3e"/>
      <rect x="23" y="36" width="18" height="8" rx="2" fill="#9fd3f0"/>
      <circle cx="25.5" cy="49" r="2" fill="#ffd43b"/><circle cx="38.5" cy="49" r="2" fill="#ffd43b"/>
      <path d="M23 55 L19 59 M41 55 L45 59" stroke="#495057" stroke-width="2"/>`,

    police: `${terra}
      <rect x="8" y="22" width="48" height="36" rx="2" fill="#dbe4f0"/>
      <rect x="6" y="16" width="52" height="8" rx="2" fill="#1c3f8f"/>
      <rect x="28" y="6" width="8" height="10" rx="2" fill="#4dabf7"/><rect x="26" y="14" width="12" height="3" fill="#1c3f8f"/>
      <path d="M32 27 L40 30 V36 Q40 43 32 47 Q24 43 24 36 V30 Z" fill="#1c3f8f"/>
      <path d="M32 31 L33.6 35 L37.6 35 L34.4 37.6 L35.6 41.6 L32 39.2 L28.4 41.6 L29.6 37.6 L26.4 35 L30.4 35 Z" fill="#ffd43b"/>
      ${fin(11, 30, 8, 9)}${fin(45, 30, 8, 9)}<rect x="27" y="49" width="10" height="9" fill="#6b4a2f"/>`,

    busstop: `${terra}
      <rect x="12" y="22" width="40" height="5" rx="2" fill="#495057"/>
      <rect x="14" y="27" width="34" height="22" fill="#9fd3f0" opacity=".55"/>
      <rect x="14" y="27" width="2.5" height="31" fill="#495057"/><rect x="45.5" y="27" width="2.5" height="31" fill="#495057"/>
      <rect x="20" y="45" width="22" height="3" rx="1" fill="#8a5a33"/>
      <rect x="52" y="12" width="2.5" height="46" fill="#868e96"/>
      <circle cx="53" cy="12" r="8" fill="#e03131"/><circle cx="53" cy="12" r="5.6" fill="#fff"/>
      <rect x="49.5" y="8.6" width="7" height="6" rx="1.4" fill="#1d5fb4"/><rect x="50.5" y="9.6" width="5" height="2" fill="#fff"/>`,

    lights: `${terra}
      <rect x="30" y="38" width="4" height="20" fill="#495057"/>
      <rect x="22" y="4" width="20" height="38" rx="5" fill="#343a40"/>
      <circle cx="32" cy="12.5" r="4.5" fill="#fa5252"/><circle cx="32" cy="23" r="4.5" fill="#fcc419"/><circle cx="32" cy="33.5" r="4.5" fill="#51cf66"/>`,

    zebra: `
      <rect x="2" y="16" width="60" height="34" rx="3" fill="#495057"/>
      ${[8, 18, 28, 38, 48].map((x) => `<rect x="${x}" y="19" width="6" height="28" fill="#f8f9fa"/>`).join("")}
      <circle cx="56" cy="11" r="5" fill="#fab005"/><rect x="55" y="15" width="2" height="8" fill="#212529"/>`,

    bakery: `${terra}
      <rect x="8" y="24" width="48" height="34" rx="2" fill="#f6e7c8"/>
      <path d="M7 18 H57 L54 27 H10 Z" fill="#e8a33a"/>
      <path d="M17 42 Q17 31 32 31 Q47 31 47 42 Q47 45 44 45 H20 Q17 45 17 42 Z" fill="#d08a3c"/>
      <path d="M24 34 L27 40 M31 33 L33 40 M38 34 L39 40" stroke="#f6e7c8" stroke-width="1.8" stroke-linecap="round"/>
      ${porta}${fin(12, 48, 9, 8)}${fin(43, 48, 9, 8)}`,

    museum: `${terra}
      <path d="M5 22 L32 8 L59 22 Z" fill="#cfc6b8"/>
      <rect x="6" y="22" width="52" height="5" fill="#b8ad9c"/>
      ${[10, 21, 32, 43].map((x) => `<rect x="${x + 1}" y="27" width="6" height="25" fill="#ece5d8"/>`).join("")}
      <rect x="6" y="52" width="52" height="6" fill="#b8ad9c"/>
      <circle cx="32" cy="17" r="2.5" fill="#8a7f6e"/>`,

    library: `${terra}
      <rect x="8" y="22" width="48" height="36" rx="2" fill="#e6dccb"/>
      <rect x="6" y="16" width="52" height="8" rx="2" fill="#5f3dc4"/>
      <rect x="16" y="29" width="7" height="18" fill="#e03131"/><rect x="24" y="31" width="6" height="16" fill="#1d5fb4"/><rect x="31" y="28" width="8" height="19" fill="#2f9e44"/>
      <rect x="40" y="31" width="6" height="16" transform="rotate(12 43 39)" fill="#f08c00"/>
      <rect x="14" y="47" width="36" height="2.5" fill="#6b4a2f"/>
      <rect x="27" y="50" width="10" height="8" fill="#6b4a2f"/>`,

    crossroads: `
      <rect x="2" y="2" width="60" height="60" rx="6" fill="#7cc36b"/>
      <rect x="22" y="2" width="20" height="60" fill="#495057"/><rect x="2" y="22" width="60" height="20" fill="#495057"/>
      <path d="M32 4 V18 M32 46 V60 M4 32 H18 M46 32 H60" stroke="#fcc419" stroke-width="2" stroke-dasharray="4 3"/>`,
  };

  const sprite = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  sprite.setAttribute("aria-hidden", "true");
  sprite.setAttribute("width", "0");
  sprite.setAttribute("height", "0");
  sprite.style.position = "absolute";
  sprite.innerHTML = Object.entries(ICONE)
    .map(([k, body]) => `<symbol id="ic-${k}" viewBox="0 0 64 64">${body}</symbol>`)
    .join("");
  const mount = () => document.body.prepend(sprite);
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);

  window.ICONE_POSTI = Object.keys(ICONE);
})();
