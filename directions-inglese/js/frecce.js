/* Frecce disegnate (usano currentColor): dritto, sinistra, destra, lato sinistro/destro. */
(function () {
  const F = {
    F: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4 L38 20 H29 V44 H19 V20 H10 Z" fill="currentColor"/></svg>',
    L: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 18 L20 4 V13 H30 Q40 13 40 24 V44 H30 V25 Q30 23 28 23 H20 V32 Z" fill="currentColor"/></svg>',
    R: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M44 18 L28 4 V13 H18 Q8 13 8 24 V44 H18 V25 Q18 23 20 23 H28 V32 Z" fill="currentColor"/></svg>',
    left: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="27" y="6" width="5" height="36" rx="2.5" fill="currentColor" opacity=".35"/><path d="M3 24 L15 13 V20 H23 V28 H15 V35 Z" fill="currentColor"/><rect x="34" y="14" width="11" height="20" rx="2" fill="currentColor" opacity=".35"/></svg>',
    right: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="16" y="6" width="5" height="36" rx="2.5" fill="currentColor" opacity=".35"/><path d="M45 24 L33 13 V20 H25 V28 H33 V35 Z" fill="currentColor"/><rect x="3" y="14" width="11" height="20" rx="2" fill="currentColor" opacity=".35"/></svg>',
    lights: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="16" y="3" width="16" height="34" rx="5" fill="currentColor"/><circle cx="24" cy="11" r="3.6" fill="#fa5252"/><circle cx="24" cy="20" r="3.6" fill="#fcc419"/><circle cx="24" cy="29" r="3.6" fill="#51cf66"/><rect x="22" y="37" width="4" height="9" fill="currentColor"/></svg>',
    end: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="19" y="14" width="10" height="32" fill="currentColor" opacity=".5"/><rect x="4" y="4" width="40" height="10" rx="2" fill="currentColor"/><path d="M24 20 V38" stroke="#fff" stroke-width="3" stroke-dasharray="4 3"/></svg>',
    past: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="28" y="16" width="16" height="16" rx="2" fill="currentColor" opacity=".35"/><path d="M14 4 L24 15 H18 V44 H10 V15 H4 Z" fill="currentColor"/></svg>',
    cross: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="2" y="12" width="44" height="24" rx="3" fill="currentColor" opacity=".3"/><rect x="8" y="14" width="5" height="20" fill="currentColor"/><rect x="17" y="14" width="5" height="20" fill="currentColor"/><rect x="26" y="14" width="5" height="20" fill="currentColor"/><rect x="35" y="14" width="5" height="20" fill="currentColor"/></svg>',
  };
  window.FRECCE = F;
  document.querySelectorAll("[data-freccia]").forEach((el) => {
    el.insertAdjacentHTML("afterbegin", F[el.dataset.freccia] || "");
  });
})();
