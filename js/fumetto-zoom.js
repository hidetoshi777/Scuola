/**
 * Pinch-to-zoom + doppio tap sulle tavole del fumetto.
 * Touch Events per pinch (iOS/fullscreen); Pointer per mouse e doppio tap.
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

  function touchDist(touches) {
    if (touches.length < 2) return 0;
    return hypot(touches[0].clientX, touches[0].clientY, touches[1].clientX, touches[1].clientY) || 1;
  }

  function touchMid(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  window.FumettoZoom = {
    attach(viewport, options) {
      if (!viewport) return null;
      const opts = options || {};
      let scale = 1;
      let tx = 0;
      let ty = 0;
      let pinchDist0 = 0;
      let pinchScale0 = 1;
      let pan0 = null;
      let downMeta = null;
      let lastTap = { t: 0, x: 0, y: 0 };
      let blockNavUntil = 0;
      let pinching = false;
      let touchMode = false;

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
        const maxX = (rect.width * (scale - 1)) / 2 + 24;
        const maxY = (rect.height * (scale - 1)) / 2 + 24;
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
        pan0 = null;
        downMeta = null;
        pinchDist0 = 0;
        touchMode = false;
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

      function finishDoubleTap(clientX, clientY) {
        const now = Date.now();
        const dt = now - lastTap.t;
        const near = hypot(clientX, clientY, lastTap.x, lastTap.y) < 36;
        if (dt > 0 && dt < DOUBLE_MS && near) {
          if (isZoomed()) {
            scale = 1;
            tx = 0;
            ty = 0;
            apply(true);
          } else {
            zoomAround(ZOOM_TAP, clientX, clientY, true);
          }
          markNavBlock(360);
          lastTap = { t: 0, x: 0, y: 0 };
        } else {
          lastTap = { t: now, x: clientX, y: clientY };
        }
      }

      /* ---- Touch (pinch affidabile su iOS, anche in fullscreen) ---- */

      function onTouchStart(event) {
        touchMode = true;
        const touches = event.touches;
        if (touches.length === 1) {
          downMeta = {
            x: touches[0].clientX,
            y: touches[0].clientY,
            t: Date.now(),
            moved: false,
          };
          if (isZoomed()) {
            pan0 = { x: touches[0].clientX, y: touches[0].clientY, tx, ty };
          } else {
            pan0 = null;
          }
        } else if (touches.length >= 2) {
          event.preventDefault();
          pinching = true;
          markNavBlock(500);
          pinchDist0 = touchDist(touches);
          pinchScale0 = scale;
          pan0 = null;
          downMeta = null;
          viewport.classList.add("is-zooming");
        }
      }

      function onTouchMove(event) {
        const touches = event.touches;
        if (touches.length >= 2) {
          event.preventDefault();
          pinching = true;
          viewport.classList.add("is-zooming");
          if (!pinchDist0) {
            pinchDist0 = touchDist(touches);
            pinchScale0 = scale;
          }
          const mid = touchMid(touches);
          zoomAround(pinchScale0 * (touchDist(touches) / pinchDist0), mid.x, mid.y, false);
          return;
        }

        if (touches.length === 1 && downMeta) {
          if (hypot(touches[0].clientX, touches[0].clientY, downMeta.x, downMeta.y) > TAP_SLOP) {
            downMeta.moved = true;
          }
        }

        if (touches.length === 1 && pan0 && isZoomed()) {
          event.preventDefault();
          tx = pan0.tx + (touches[0].clientX - pan0.x);
          ty = pan0.ty + (touches[0].clientY - pan0.y);
          apply(false);
        }
      }

      function onTouchEnd(event) {
        const touches = event.touches;
        if (touches.length >= 2) {
          pinchDist0 = touchDist(touches);
          pinchScale0 = scale;
          return;
        }

        if (touches.length === 1 && isZoomed()) {
          pinchDist0 = 0;
          pan0 = { x: touches[0].clientX, y: touches[0].clientY, tx, ty };
          return;
        }

        viewport.classList.remove("is-zooming");
        const wasPinch = pinching;
        pinching = false;
        pinchDist0 = 0;
        pan0 = null;

        if (!wasPinch && downMeta && !downMeta.moved && event.changedTouches[0]) {
          const t = event.changedTouches[0];
          finishDoubleTap(t.clientX, t.clientY);
        }
        downMeta = null;
        if (typeof opts.onZoomChange === "function") opts.onZoomChange(isZoomed());
        if (touches.length === 0) {
          window.setTimeout(() => {
            touchMode = false;
          }, 50);
        }
      }

      /* ---- Mouse (desktop): doppio click + drag se zoomato ---- */

      function onPointerDown(event) {
        if (touchMode || event.pointerType === "touch") return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        downMeta = {
          x: event.clientX,
          y: event.clientY,
          t: Date.now(),
          moved: false,
          id: event.pointerId,
        };
        if (isZoomed()) {
          pan0 = { x: event.clientX, y: event.clientY, tx, ty };
          viewport.classList.add("is-zooming");
          try {
            viewport.setPointerCapture(event.pointerId);
          } catch (err) {
            /* ignore */
          }
        }
      }

      function onPointerMove(event) {
        if (touchMode || event.pointerType === "touch") return;
        if (!downMeta || downMeta.id !== event.pointerId) return;
        if (hypot(event.clientX, event.clientY, downMeta.x, downMeta.y) > TAP_SLOP) {
          downMeta.moved = true;
        }
        if (pan0 && isZoomed()) {
          tx = pan0.tx + (event.clientX - pan0.x);
          ty = pan0.ty + (event.clientY - pan0.y);
          apply(false);
        }
      }

      function onPointerUp(event) {
        if (touchMode || event.pointerType === "touch") return;
        if (!downMeta || downMeta.id !== event.pointerId) return;
        viewport.classList.remove("is-zooming");
        pan0 = null;
        if (!downMeta.moved) {
          finishDoubleTap(event.clientX, event.clientY);
        }
        downMeta = null;
        if (typeof opts.onZoomChange === "function") opts.onZoomChange(isZoomed());
      }

      function onWheel(event) {
        if (!event.ctrlKey && Math.abs(event.deltaY) < 40) return;
        event.preventDefault();
        const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
        zoomAround(scale * factor, event.clientX, event.clientY, false);
        markNavBlock(200);
      }

      viewport.addEventListener("touchstart", onTouchStart, { passive: false });
      viewport.addEventListener("touchmove", onTouchMove, { passive: false });
      viewport.addEventListener("touchend", onTouchEnd, { passive: false });
      viewport.addEventListener("touchcancel", onTouchEnd, { passive: false });
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
          viewport.removeEventListener("touchstart", onTouchStart);
          viewport.removeEventListener("touchmove", onTouchMove);
          viewport.removeEventListener("touchend", onTouchEnd);
          viewport.removeEventListener("touchcancel", onTouchEnd);
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
