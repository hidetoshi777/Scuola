(function () {
  const TAU = Math.PI * 2;
  const SUN = normalize({ x: -1, y: 0, z: 0 });
  const MAP_W = 1024;
  const MAP_H = 512;

  const CITIES = [
    { id: "roma", name: "Roma", lat: 41.9, lon: 12.5 },
    { id: "newyork", name: "New York", lat: 40.7, lon: -74.0 },
    { id: "rio", name: "Rio de Janeiro", lat: -22.9, lon: -43.2 },
    { id: "nairobi", name: "Nairobi", lat: -1.3, lon: 36.8 },
    { id: "tokyo", name: "Tokyo", lat: 35.7, lon: 139.7 },
    { id: "sydney", name: "Sydney", lat: -33.9, lon: 151.2 },
  ];

  let mapData = null;

  function normalize(v) {
    const len = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }

  function toRad(deg) {
    return (deg * Math.PI) / 180;
  }

  function project(latDeg, lonDeg, rot, radius) {
    const lat = toRad(latDeg);
    const lon = toRad(lonDeg) + rot;
    const x = Math.cos(lat) * Math.sin(lon);
    const y = Math.sin(lat);
    const z = Math.cos(lat) * Math.cos(lon);
    return { x: x * radius, y: -y * radius, z: z * radius, nx: x, ny: y, nz: z };
  }

  function sunDot(nx, ny, nz) {
    return nx * SUN.x + ny * SUN.y + nz * SUN.z;
  }

  function solarHour(latDeg, lonDeg, rot) {
    const p = project(latDeg, lonDeg, rot, 1);
    const pointAngle = Math.atan2(p.nx, p.nz);
    const sunAngle = Math.atan2(SUN.x, SUN.z);
    let diff = ((pointAngle - sunAngle) * 180) / Math.PI;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    let hour = 12 + diff / 15;
    while (hour < 0) hour += 24;
    while (hour >= 24) hour -= 24;
    return hour;
  }

  function formatHour(hour) {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function isDay(lat, lon, rot) {
    const p = project(lat, lon, rot, 1);
    return sunDot(p.nx, p.ny, p.nz) > 0.02;
  }

  function lonToX(lon) {
    return ((lon + 180) / 360) * MAP_W;
  }

  function latToY(lat) {
    return ((90 - lat) / 180) * MAP_H;
  }

  function inBox(lat, lon, lat0, lat1, lon0, lon1) {
    return lat >= lat0 && lat <= lat1 && lon >= lon0 && lon <= lon1;
  }

  function landColor(lat, lon) {
    if (lat > 72 || lat < -60) {
      return [232, 241, 247];
    }
    if (
      inBox(lat, lon, 16, 30, -15, 32) ||
      inBox(lat, lon, 17, 30, 38, 55) ||
      inBox(lat, lon, 24, 38, -115, -105) ||
      inBox(lat, lon, -28, -23, 122, 140)
    ) {
      return [210, 176, 106];
    }
    if (inBox(lat, lon, -10, 8, -75, -50) || inBox(lat, lon, -5, 8, 8, 30) || lat > 55) {
      return [46, 122, 72];
    }
    return [62, 158, 86];
  }

  function buildMap() {
    const canvas = document.createElement("canvas");
    canvas.width = MAP_W;
    canvas.height = MAP_H;
    const ctx = canvas.getContext("2d");
    const ocean = ctx.createLinearGradient(0, 0, 0, MAP_H);
    ocean.addColorStop(0, "#8ec7ef");
    ocean.addColorStop(0.18, "#1d6fb3");
    ocean.addColorStop(0.5, "#0e4d8a");
    ocean.addColorStop(0.82, "#1d6fb3");
    ocean.addColorStop(1, "#c5e7f7");
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, MAP_W, MAP_H);

    const rings = window.TERRA_LAND || [];
    ctx.fillStyle = "#3e9e56";
    ctx.strokeStyle = "#2c7a43";
    ctx.lineWidth = 0.7;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, MAP_W, MAP_H);
    ctx.clip();
    [-360, 0, 360].forEach((shift) => {
      rings.forEach((ring) => {
        ctx.beginPath();
        ring.forEach(([lon, lat], i) => {
          const x = lonToX(lon + shift);
          const y = latToY(lat);
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.closePath();
        ctx.fill();
      });
    });
    ctx.restore();

    const img = ctx.getImageData(0, 0, MAP_W, MAP_H);
    const data = img.data;
    for (let y = 0; y < MAP_H; y += 1) {
      const lat = 90 - (y / MAP_H) * 180;
      for (let x = 0; x < MAP_W; x += 1) {
        const i = (y * MAP_W + x) * 4;
        const g = data[i + 1];
        const b = data[i + 2];
        if (g <= b + 8) {
          continue;
        }
        const lon = (x / MAP_W) * 360 - 180;
        const [r2, g2, b2] = landColor(lat, lon);
        data[i] = r2;
        data[i + 1] = g2;
        data[i + 2] = b2;
      }
    }
    ctx.putImageData(img, 0, 0);
    mapData = ctx.getImageData(0, 0, MAP_W, MAP_H).data;
  }

  function sampleMap(lonDeg, latDeg) {
    let lon = lonDeg;
    while (lon < -180) lon += 360;
    while (lon > 180) lon -= 360;
    const x = lonToX(lon);
    const y = Math.max(0, Math.min(MAP_H - 1.001, latToY(latDeg)));
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = (x0 + 1) % MAP_W;
    const y1 = Math.min(MAP_H - 1, y0 + 1);
    const fx = x - x0;
    const fy = y - y0;
    const i00 = (y0 * MAP_W + (x0 + MAP_W) % MAP_W) * 4;
    const i10 = (y0 * MAP_W + x1) * 4;
    const i01 = (y1 * MAP_W + (x0 + MAP_W) % MAP_W) * 4;
    const i11 = (y1 * MAP_W + x1) * 4;
    const mix = (a, b, t) => a + (b - a) * t;
    return [0, 1, 2].map((c) =>
      mix(mix(mapData[i00 + c], mapData[i10 + c], fx), mix(mapData[i01 + c], mapData[i11 + c], fx), fy),
    );
  }

  function renderGlobe(off, radius, rot, dpr) {
    const size = Math.max(2, Math.round(radius * 2 * dpr));
    if (off.width !== size || off.height !== size) {
      off.width = size;
      off.height = size;
    }
    const g = off.getContext("2d");
    const img = g.createImageData(size, size);
    const pix = img.data;
    const r = size / 2;
    const r2 = r * r;
    for (let py = 0; py < size; py += 1) {
      const sy = py - r;
      const sy2 = sy * sy;
      for (let px = 0; px < size; px += 1) {
        const sx = px - r;
        const d2 = sx * sx + sy2;
        if (d2 > r2) {
          continue;
        }
        const nz = Math.sqrt(Math.max(0, r2 - d2));
        const nx = sx / r;
        const ny = -sy / r;
        const nzN = nz / r;
        const lon = Math.atan2(nx, nzN) - rot;
        const lat = Math.asin(Math.max(-1, Math.min(1, ny)));
        const [mr, mg, mb] = sampleMap((lon * 180) / Math.PI, (lat * 180) / Math.PI);
        const light = Math.max(0.07, Math.min(1.15, -nx * 0.9 + 0.38));
        const night = light < 0.22;
        const i = (py * size + px) * 4;
        pix[i] = Math.min(255, mr * light + (night ? 8 : 0));
        pix[i + 1] = Math.min(255, mg * light + (night ? 12 : 0));
        pix[i + 2] = Math.min(255, mb * light + (night ? 28 : 0));
        pix[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return off;
  }

  function create(canvas, options) {
    const opts = {
      autoRotate: true,
      speed: 0.22,
      showCities: true,
      showAxis: false,
      tilt: false,
      interactive: true,
      highlight: "roma",
      cities: CITIES,
      onChange: null,
      ...options,
    };
    const ctx = canvas.getContext("2d");
    const globeOff = document.createElement("canvas");
    let rot = opts.rotation ?? 0.4;
    let dragging = false;
    let lastX = 0;
    let raf = 0;
    let running = true;

    if (!mapData) {
      buildMap();
    }

    const reduced = document.body.classList.contains("reduced-motion");
    if (reduced) {
      opts.autoRotate = false;
    }

    function resize() {
      const size = Math.min(canvas.clientWidth || 420, 560);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.height = `${size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      const w = canvas.clientWidth || 420;
      const h = canvas.clientHeight || w;
      const cx = w / 2;
      const cy = h / 2;
      const radius = w * 0.38;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(cx, cy);

      ctx.save();
      ctx.translate(-radius * 1.28, -radius * 0.08);
      const sunGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 34);
      sunGlow.addColorStop(0, "#fff6c8");
      sunGlow.addColorStop(0.35, "#ffc857");
      sunGlow.addColorStop(1, "rgba(255, 200, 80, 0)");
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#ffe08a";
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, TAU);
      ctx.fill();
      ctx.restore();

      if (opts.tilt) {
        ctx.rotate(toRad(-23.5));
      }

      const glow = ctx.createRadialGradient(0, 0, radius, 0, 0, radius * 1.28);
      glow.addColorStop(0, "rgba(120, 190, 255, 0.0)");
      glow.addColorStop(0.62, "rgba(90, 170, 255, 0.12)");
      glow.addColorStop(1, "rgba(90, 170, 255, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.28, 0, TAU);
      ctx.fill();

      if (opts.showAxis) {
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -radius * 1.22);
        ctx.lineTo(0, radius * 1.22);
        ctx.stroke();
        ctx.fillStyle = "#ffd9a0";
        ctx.beginPath();
        ctx.arc(0, -radius * 1.22, 5, 0, TAU);
        ctx.fill();
      }

      const globeDpr = Math.min(dpr, 2);
      renderGlobe(globeOff, radius, rot, globeDpr);
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.clip();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(globeOff, -radius, -radius, radius * 2, radius * 2);

      if (opts.showCities) {
        opts.cities.forEach((city) => {
          const p = project(city.lat, city.lon, rot, radius);
          if (p.z < 0) {
            return;
          }
          const day = sunDot(p.nx, p.ny, p.nz) > 0.02;
          ctx.beginPath();
          ctx.arc(p.x, p.y, city.id === opts.highlight ? 6 : 4.2, 0, TAU);
          ctx.fillStyle = day ? "#ffd166" : "#dce9ff";
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "rgba(6, 16, 36, 0.8)";
          ctx.stroke();
          if (city.id === opts.highlight) {
            ctx.font = "700 13px Nunito, sans-serif";
            ctx.fillStyle = "#fff";
            ctx.strokeStyle = "rgba(6,16,36,0.7)";
            ctx.lineWidth = 3;
            ctx.strokeText(city.name, p.x + 8, p.y - 8);
            ctx.fillText(city.name, p.x + 8, p.y - 8);
          }
        });
      }
      ctx.restore();

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.strokeStyle = "rgba(180, 220, 255, 0.35)";
      ctx.lineWidth = 3;
      ctx.stroke();

      const rim = ctx.createRadialGradient(-radius * 0.35, -radius * 0.4, radius * 0.2, 0, 0, radius);
      rim.addColorStop(0, "rgba(255,255,255,0.22)");
      rim.addColorStop(0.45, "rgba(255,255,255,0)");
      rim.addColorStop(1, "rgba(0,0,0,0.28)");
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.fill();

      ctx.restore();
    }

    function tick() {
      if (!running) {
        return;
      }
      if (opts.autoRotate && !dragging) {
        rot = (rot + opts.speed * 0.016) % TAU;
        if (opts.onChange) {
          opts.onChange(snapshot());
        }
      }
      draw();
      raf = requestAnimationFrame(tick);
    }

    function snapshot() {
      return {
        rotation: rot,
        cities: opts.cities.map((city) => ({
          ...city,
          hour: solarHour(city.lat, city.lon, rot),
          day: isDay(city.lat, city.lon, rot),
        })),
      };
    }

    function onPointerDown(event) {
      if (!opts.interactive) {
        return;
      }
      dragging = true;
      lastX = event.clientX;
      canvas.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event) {
      if (!dragging) {
        return;
      }
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      rot += dx * 0.01;
      if (opts.onChange) {
        opts.onChange(snapshot());
      }
    }

    function onPointerUp() {
      dragging = false;
    }

    resize();
    canvas.style.cursor = opts.interactive ? "grab" : "default";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return {
      setAutoRotate(value) {
        opts.autoRotate = value && !reduced;
      },
      setSpeed(value) {
        opts.speed = value;
      },
      setRotation(value) {
        rot = value;
        if (opts.onChange) {
          opts.onChange(snapshot());
        }
      },
      setAxis(value) {
        opts.showAxis = value;
      },
      setTilt(value) {
        opts.tilt = value;
      },
      setHighlight(id) {
        opts.highlight = id;
      },
      setInteractive(value) {
        opts.interactive = value;
        canvas.style.cursor = value ? "grab" : "default";
      },
      snapshot,
      destroy() {
        running = false;
        cancelAnimationFrame(raf);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerUp);
        window.removeEventListener("resize", resize);
      },
    };
  }

  window.Terra = {
    CITIES,
    create,
    solarHour,
    formatHour,
    isDay,
  };
})();
