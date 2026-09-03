document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("globo-home");
  if (!canvas || !window.Terra) {
    return;
  }
  Terra.create(canvas, {
    autoRotate: true,
    speed: 0.28,
    highlight: "roma",
    showAxis: false,
  });
});
