(function () {
  const EN = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
  ];
  const IT = [
    "",
    "l’una",
    "le due",
    "le tre",
    "le quattro",
    "le cinque",
    "le sei",
    "le sette",
    "le otto",
    "le nove",
    "le dieci",
    "le undici",
    "le dodici",
  ];

  function wrapHour(h) {
    const n = Number(h) % 12;
    return n === 0 ? 12 : n;
  }

  function angles(hour, minute) {
    const m = Number(minute) || 0;
    const h = wrapHour(hour);
    return {
      minute: m * 6,
      hour: h * 30 + m * 0.5,
    };
  }

  function frase(hour, minute) {
    const h = wrapHour(hour);
    const m = Number(minute) || 0;
    const next = wrapHour(h + 1);
    const itVerb = h === 1 ? "È" : "Sono";
    const itNext = next === 1 ? "È" : "Sono";

    if (m === 0) {
      return {
        en: "It’s " + EN[h] + " o’clock.",
        it: itVerb + " " + IT[h] + " in punto.",
        tag: "o’clock",
      };
    }
    if (m === 30) {
      return {
        en: "It’s half past " + EN[h] + ".",
        it: itVerb + " " + IT[h] + " e mezza.",
        tag: "half past",
      };
    }
    if (m === 15) {
      return {
        en: "It’s quarter past " + EN[h] + ".",
        it: itVerb + " " + IT[h] + " e un quarto.",
        tag: "quarter past",
      };
    }
    if (m === 45) {
      return {
        en: "It’s quarter to " + EN[next] + ".",
        it: itNext + " " + IT[next] + " meno un quarto.",
        tag: "quarter to",
      };
    }
    return {
      en: "It’s " + EN[h] + " o’clock.",
      it: itVerb + " " + IT[h] + " in punto.",
      tag: "o’clock",
    };
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function digitale(hour, minute) {
    return wrapHour(hour) + ":" + pad(minute);
  }

  function svgMarkup(hour, minute, opts) {
    const o = opts || {};
    const a = angles(hour, minute);
    const label = o.label || "Orologio: " + digitale(hour, minute);
    const ticks = [];
    for (let i = 0; i < 60; i += 1) {
      const major = i % 5 === 0;
      const rot = i * 6;
      const len = major ? 10 : 5;
      ticks.push(
        '<line class="' +
          (major ? "clk-tick clk-tick--h" : "clk-tick") +
          '" x1="100" y1="14" x2="100" y2="' +
          (14 + len) +
          '" transform="rotate(' +
          rot +
          ' 100 100)"/>'
      );
    }
    const nums = [];
    for (let n = 1; n <= 12; n += 1) {
      const rad = ((n * 30 - 90) * Math.PI) / 180;
      const x = 100 + Math.cos(rad) * 68;
      const y = 100 + Math.sin(rad) * 68 + 1.2;
      nums.push(
        '<text class="clk-num" x="' +
          x.toFixed(1) +
          '" y="' +
          y.toFixed(1) +
          '" text-anchor="middle" dominant-baseline="middle">' +
          n +
          "</text>"
      );
    }
    return (
      '<svg class="clk" viewBox="0 0 200 200" role="img" aria-label="' +
      label.replace(/"/g, "&quot;") +
      '">' +
      '<circle class="clk-rim" cx="100" cy="100" r="98"/>' +
      '<circle class="clk-face" cx="100" cy="100" r="90"/>' +
      ticks.join("") +
      nums.join("") +
      '<g class="clk-hand clk-hour" style="transform: rotate(' +
      a.hour +
      'deg)">' +
      '<rect x="96.6" y="42" width="6.8" height="62" rx="3.2"/>' +
      "</g>" +
      '<g class="clk-hand clk-minute" style="transform: rotate(' +
      a.minute +
      'deg)">' +
      '<rect x="97.6" y="20" width="4.8" height="82" rx="2.4"/>' +
      "</g>" +
      '<circle class="clk-cap" cx="100" cy="100" r="6.2"/>' +
      "</svg>"
    );
  }

  function mount(el, hour, minute, opts) {
    if (!el) return null;
    el.innerHTML = svgMarkup(hour, minute, opts);
    return el.querySelector(".clk");
  }

  function setHands(root, hour, minute) {
    if (!root) return;
    const a = angles(hour, minute);
    const hourHand = root.querySelector(".clk-hour");
    const minuteHand = root.querySelector(".clk-minute");
    if (hourHand) hourHand.style.transform = "rotate(" + a.hour + "deg)";
    if (minuteHand) minuteHand.style.transform = "rotate(" + a.minute + "deg)";
    root.setAttribute("aria-label", "Orologio: " + digitale(hour, minute));
  }

  function fillAll(scope) {
    const root = scope || document;
    root.querySelectorAll("[data-clock]").forEach((el) => {
      const h = Number(el.getAttribute("data-h"));
      const m = Number(el.getAttribute("data-m"));
      mount(el, h, m);
    });
  }

  window.Orologio = {
    angles,
    frase,
    digitale,
    wrapHour,
    svgMarkup,
    mount,
    setHands,
    fillAll,
    EN,
    IT,
  };

  fillAll(document);
})();
