/**
 * Pinch-to-zoom + doppio tap sulle tavole del fumetto.
 * Uso: const zoom = FumettoZoom.attach(viewport); zoom.reset() al cambio pagina.
 */
(function () {
  const MIN = 1;
  const MAX = 3.6;
  const DOUBLE_MS = 300;
  const TAP_SLOP = 14;
  const ZOOM_TAP = 2.35;

  function hypot(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  window.FumettoZoom = {
    attach(viewport, options) {
      if (!viewport) return null;
      const opts = options || {};
      let scale = 1;
      let tx = 0;
      let ty = 0;
      const pointers = new Map();
      let pinchDist0 = 0;
      let pinchScale0 = 1;
      let pan0 = null;
      let downMeta = null;
      let lastTap = { t: 0, x: 0, y: 0 };
      let blockNavUntil = 0;
      let pinching = false;

      function activeImg() {
        if (typeof opts.getImage === "function") return opts.getImage();
        return viewport.querySelector(".fumetto-page.is-active img");
      }

      function clampPan() {
        if (scale <= 1.02) {
          tx = 0;
          ty = 0;
          return;
        }
        const rect = viewport.getBoundingClientRect();
        const maxX = (rect.width * (scale - 1)) / 2 + 8;
        const maxY = (rect.height * (scale - 1)) / 2 + 8;
        tx = Math.max(-maxX, Math.min(maxX, tx));
        ty = Math.max(-maxY, Math.min(maxY, ty));
      }

      function apply(animated) {
        const img = activeImg();
        if (!img) return;
        clampPan();
        img.style.transition = animated ? "transform 0.22s ease" : "none";
        img.style.transformOrigin = "center center";
        img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        const zoomed = scale > 1.02;
        viewport.classList.toggle("is-zoomed", zoomed);
        if (typeof opts.onZoomChange === "function") opts.onZoomChange(zoomed);
      }

      function zoomAround(nextScale, clientX, clientY, animated) {
        const rect = viewport.getBoundingClientRect();
        const px = clientX - rect.left - rect.width / 2;
        const py = clientY - rect.top - rect.height / 2;
        const prev = scale || 1;
        scale = Math.max(MIN, Math.min(MAX, nextScale));
        if (scale <= 1.02) {
          scale = 1;
          tx = 0;
          ty = 0;
        } else {
          tx = px - (scale / prev) * (px - tx);
          ty = py - (scale / prev) * (py - ty);
        }
        apply(animated);
      }

      function reset() {
        scale = 1;
        tx = 0;
        ty = 0;
        pinching = false;
        pointers.clear();
        pan0 = null;
        downMeta = null;
        viewport.classList.remove("is-zoomed", "is-zooming");
        viewport.querySelectorAll(".fumetto-page img").forEach((img) => {
          img.style.transition = "none";
          img.style.transform = "";
        });
        if (typeof opts.onZoomChange === "function") opts.onZoomChange(false);
      }

      function isZoomed() {
        return scale > 1.02;
      }

      function blocksNav() {
        return isZoomed() || pinching || Date.now() < blockNavUntil;
      }

      function markNavBlock(ms) {
        blockNavUntil = Date.now() + (ms || 320);
      }

      function onPointerDown(event) {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        try {
          viewport.setPointerCapture(event.pointerId);
        } catch (err) {
          /* ignore */
        }
        viewport.classList.add("is-zooming");

        if (pointers.size === 1) {
          downMeta = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            t: Date.now(),
            moved: false,
          };
          if (isZoomed()) {
            pan0 = { x: event.clientX, y: event.clientY, tx, ty };
          } else {
            pan0 = null;
          }
        } else if (pointers.size === 2) {
          pinching = true;
          markNavBlock(400);
          const pts = Array.from(pointers.values());
          pinchDist0 = hypot(pts[0].x, pts[0].y, pts[1].x, pts[1].y) || 1;
          pinchScale0 = scale;
          pan0 = null;
          downMeta = null;
        }
      }

      function onPointerMove(event) {
        if (!pointers.has(event.pointerId)) return;
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (downMeta && event.pointerId === downMeta.id) {
          if (hypot(event.clientX, event.clientY, downMeta.x, downMeta.y) > TAP_SLOP) {
            downMeta.moved = true;
          }
        }

        if (pointers.size >= 2) {
          pinching = true;
          const pts = Array.from(pointers.values());
          const dist = hypot(pts[0].x, pts[0].y, pts[1].x, pts[1].y) || 1;
          const midX = (pts[0].x + pts[1].x) / 2;
          const midY = (pts[0].y + pts[1].y) / 2;
          zoomAround(pinchScale0 * (dist / pinchDist0), midX, midY, false);
          return;
        }

        if (pointers.size === 1 && pan0 && isZoomed()) {
          tx = pan0.tx + (event.clientX - pan0.x);
          ty = pan0.ty + (event.clientY - pan0.y);
          apply(false);
        }
      }

      function onPointerUp(event) {
        if (!pointers.has(event.pointerId)) return;
        pointers.delete(event.pointerId);

        if (pointers.size < 2) {
          pinchDist0 = 0;
        }

        if (pointers.size === 1 && isZoomed()) {
          const only = Array.from(pointers.values())[0];
          pan0 = { x: only.x, y: only.y, tx, ty };
        }

        if (pointers.size === 0) {
          viewport.classList.remove("is-zooming");
          pan0 = null;

          const wasPinch = pinching;
          pinching = false;

          if (!wasPinch && downMeta && event.pointerId === downMeta.id && !downMeta.moved) {
            const now = Date.now();
            const dt = now - lastTap.t;
            const near = hypot(event.clientX, event.clientY, lastTap.x, lastTap.y) < 36;
            if (dt > 0 && dt < DOUBLE_MS && near) {
              if (isZoomed()) {
                scale = 1;
                tx = 0;
                ty = 0;
                apply(true);
              } else {
                zoomAround(ZOOM_TAP, event.clientX, event.clientY, true);
              }
              markNavBlock(360);
              lastTap = { t: 0, x: 0, y: 0 };
            } else {
              lastTap = { t: now, x: event.clientX, y: event.clientY };
            }
          }
          downMeta = null;
          if (typeof opts.onZoomChange === "function") opts.onZoomChange(isZoomed());
        }
      }

      function onWheel(event) {
        if (!event.ctrlKey && Math.abs(event.deltaY) < 40) return;
        event.preventDefault();
        const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
        zoomAround(scale * factor, event.clientX, event.clientY, false);
        markNavBlock(200);
      }

      viewport.addEventListener("pointerdown", onPointerDown);
      viewport.addEventListener("pointermove", onPointerMove);
      viewport.addEventListener("pointerup", onPointerUp);
      viewport.addEventListener("pointercancel", onPointerUp);
      viewport.addEventListener("wheel", onWheel, { passive: false });
      viewport.classList.add("has-zoom");

      return {
        reset,
        isZoomed,
        blocksNav,
        destroy() {
          viewport.removeEventListener("pointerdown", onPointerDown);
          viewport.removeEventListener("pointermove", onPointerMove);
          viewport.removeEventListener("pointerup", onPointerUp);
          viewport.removeEventListener("pointercancel", onPointerUp);
          viewport.removeEventListener("wheel", onWheel);
          reset();
          viewport.classList.remove("has-zoom");
        },
      };
    },
  };
})();
