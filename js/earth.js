(function () {
  const TAU = Math.PI * 2;
  const SUN = normalize({ x: -1, y: 0, z: 0 });

  const CITIES = [
    { id: "roma", name: "Roma", lat: 41.9, lon: 12.5 },
    { id: "newyork", name: "New York", lat: 40.7, lon: -74.0 },
    { id: "rio", name: "Rio de Janeiro", lat: -22.9, lon: -43.2 },
    { id: "nairobi", name: "Nairobi", lat: -1.3, lon: 36.8 },
    { id: "tokyo", name: "Tokyo", lat: 35.7, lon: 139.7 },
    { id: "sydney", name: "Sydney", lat: -33.9, lon: 151.2 },
  ];

  const CONTINENTS = [
    {
      color: "#3f9a5c",
      rings: [
        [
          [71, -8], [70, 20], [71, 28], [70, 52], [66, 40], [60, 30], [56, 10],
          [54, 8], [51, 2], [48, -5], [43, -9], [36, -6], [36, -2], [38, 0],
          [36, 15], [41, 16], [38, 24], [41, 29], [36, 36], [41, 41], [47, 39],
          [45, 32], [48, 28], [54, 20], [60, 23], [69, 18], [71, -8],
        ],
      ],
    },
    {
      color: "#3c8f55",
      rings: [
        [
          [37, -6], [32, -10], [21, -17], [12, -16], [5, -8], [4, 7], [-5, 12],
          [-18, 12], [-28, 15], [-35, 20], [-34, 28], [-26, 34], [-15, 40],
          [0, 42], [12, 51], [12, 43], [30, 32], [32, 22], [37, 11], [37, -6],
        ],
      ],
    },
    {
      color: "#4aa15f",
      rings: [
        [
          [75, 70], [72, 100], [70, 140], [65, 170], [60, 165], [55, 140],
          [50, 144], [42, 130], [35, 128], [22, 120], [8, 98], [8, 78],
          [15, 74], [25, 68], [22, 56], [30, 48], [36, 54], [48, 50],
          [55, 70], [62, 75], [70, 80], [75, 70],
        ],
        [
          [22, 72], [8, 77], [6, 80], [15, 94], [22, 88], [25, 80], [22, 72],
        ],
        [
          [1, 100], [-8, 115], [-10, 140], [0, 132], [5, 120], [6, 105], [1, 100],
        ],
      ],
    },
    {
      color: "#3d9458",
      rings: [
        [
          [70, -165], [68, -140], [60, -140], [55, -130], [50, -125], [48, -55],
          [45, -64], [41, -70], [30, -81], [25, -80], [25, -97], [18, -92],
          [15, -87], [8, -77], [12, -84], [16, -88], [21, -105], [32, -117],
          [40, -124], [49, -126], [58, -137], [66, -168], [70, -165],
        ],
      ],
    },
    {
      color: "#4aa560",
      rings: [
        [
          [12, -72], [8, -77], [4, -76], [-5, -79], [-18, -70], [-42, -74],
          [-52, -68], [-55, -68], [-50, -58], [-35, -54], [-23, -42], [-5, -35],
          [4, -50], [11, -62], [12, -72],
        ],
      ],
    },
    {
      color: "#4aad66",
      rings: [
        [
          [-11, 113], [-12, 126], [-15, 129], [-26, 153], [-38, 148],
          [-35, 138], [-32, 116], [-22, 114], [-16, 122], [-11, 113],
        ],
      ],
    },
    {
      color: "#d7e7ea",
      rings: [
        [
          [84, -40], [75, -18], [70, -22], [60, -44], [65, -52], [76, -68],
          [83, -40],
        ],
      ],
    },
    {
      color: "#e8f2f4",
      rings: [
        [
          [-63, -60], [-70, -10], [-72, 40], [-70, 90], [-68, 140], [-72, 170],
          [-76, 120], [-78, 40], [-75, -40], [-70, -80], [-63, -60],
        ],
      ],
    },
  ];

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
    let rot = opts.rotation ?? 0.4;
    let dragging = false;
    let lastX = 0;
    let raf = 0;
    let running = true;

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

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.fillStyle = "#124e8a";
      ctx.fill();
      ctx.save();
      ctx.clip();

      CONTINENTS.forEach((continent) => {
        continent.rings.forEach((ring) => {
          const pts = ring.map(([lat, lon]) => project(lat, lon, rot, radius));
          if (pts.filter((p) => p.z > 0).length < 3) {
            return;
          }
          ctx.beginPath();
          let started = false;
          pts.forEach((p) => {
            if (p.z <= -radius * 0.05) {
              started = false;
              return;
            }
            if (!started) {
              ctx.moveTo(p.x, p.y);
              started = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          });
          ctx.closePath();
          ctx.fillStyle = continent.color;
          ctx.fill();
        });
      });

      const shade = ctx.createLinearGradient(-radius, 0, radius, 0);
      shade.addColorStop(0, "rgba(255, 220, 150, 0.12)");
      shade.addColorStop(0.42, "rgba(0, 0, 0, 0)");
      shade.addColorStop(0.58, "rgba(4, 10, 28, 0.28)");
      shade.addColorStop(1, "rgba(3, 8, 22, 0.72)");
      ctx.fillStyle = shade;
      ctx.fillRect(-radius, -radius, radius * 2, radius * 2);

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
      rim.addColorStop(0, "rgba(255,255,255,0.18)");
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
