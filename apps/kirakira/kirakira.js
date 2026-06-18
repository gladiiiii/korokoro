const sparklePad = document.querySelector("#sparklePad");
const soundButton = document.querySelector("#soundButton");
const shineSlider = document.querySelector("#shineSlider");
const pitchSlider = document.querySelector("#pitchSlider");
const statusText = document.querySelector("#statusText");

const AudioEngine = window.AudioContext || window.webkitAudioContext;
const columns = window.matchMedia("(max-width: 380px)").matches ? 4 : 5;
const rows = window.matchMedia("(max-width: 380px)").matches ? 9 : 8;
const sparkleCount = columns * rows;
const notes = [523, 587, 659, 784, 880, 988, 1047, 1175, 1319];
const colors = ["#7c5cff", "#f7c948", "#3bb273", "#ef5b4a", "#4387f4", "#e9548f"];

let audioContext;
let soundEnabled = true;
let activePointerId = null;
let lastSparkle = null;
let lastHitAt = 0;

function createSparkles() {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < sparkleCount; index += 1) {
    const sparkle = document.createElement("button");
    const x = index % columns;
    const y = Math.floor(index / columns);

    sparkle.type = "button";
    sparkle.className = "sparkle";
    sparkle.dataset.index = String(index);
    sparkle.dataset.x = String(x);
    sparkle.dataset.y = String(y);
    sparkle.style.setProperty("--color", colors[(x + y) % colors.length]);
    sparkle.style.setProperty("--tilt", `${(index % 5) * 12 - 24}deg`);
    sparkle.setAttribute("aria-label", `Sparkle ${index + 1}`);

    fragment.append(sparkle);
  }

  sparklePad.append(fragment);
}

function ensureAudio() {
  if (!AudioEngine) {
    statusText.textContent = "Audio unavailable";
    return false;
  }

  if (!audioContext) {
    audioContext = new AudioEngine();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return true;
}

function vibrate(sparkle) {
  if (!("vibrate" in navigator)) {
    statusText.textContent = "Visual mode";
    return;
  }

  const shine = Number(shineSlider.value);
  const x = Number(sparkle.dataset.x);
  navigator.vibrate([5 + shine * 3, 14, 4 + x * 2]);
}

function playSound(sparkle) {
  if (!soundEnabled || !ensureAudio()) {
    return;
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const overtone = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const x = Number(sparkle.dataset.x);
  const y = Number(sparkle.dataset.y);
  const pitch = Number(pitchSlider.value);
  const noteIndex = (rows - 1 - y + x + pitch) % notes.length;
  const frequency = notes[noteIndex];

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);

  overtone.type = "triangle";
  overtone.frequency.setValueAtTime(frequency * 2.01, now);

  filter.type = "highpass";
  filter.frequency.setValueAtTime(520 + pitch * 80, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.13 + Number(shineSlider.value) * 0.018, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

  oscillator.connect(filter);
  overtone.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  overtone.start(now);
  oscillator.stop(now + 0.36);
  overtone.stop(now + 0.24);
}

function addBurst(sparkle) {
  const rect = sparkle.getBoundingClientRect();
  const padRect = sparklePad.getBoundingClientRect();
  const burst = document.createElement("span");
  const shine = Number(shineSlider.value);

  burst.className = "spark-burst";
  burst.style.setProperty("--x", `${rect.left - padRect.left + rect.width / 2}px`);
  burst.style.setProperty("--y", `${rect.top - padRect.top + rect.height / 2}px`);
  burst.style.setProperty("--size", `${42 + shine * 12}px`);
  burst.style.setProperty("--color", sparkle.style.getPropertyValue("--color"));
  burst.style.setProperty("--tilt", sparkle.style.getPropertyValue("--tilt"));

  sparklePad.append(burst);
  window.setTimeout(() => burst.remove(), 560);
}

function flashSparkle(sparkle) {
  sparkle.classList.add("active");
  window.setTimeout(() => sparkle.classList.remove("active"), 150);
}

function hitSparkle(sparkle) {
  if (!sparkle || !sparkle.classList.contains("sparkle")) {
    return;
  }

  const now = performance.now();

  if (sparkle === lastSparkle && now - lastHitAt < 95) {
    return;
  }

  lastSparkle = sparkle;
  lastHitAt = now;

  flashSparkle(sparkle);
  addBurst(sparkle);
  vibrate(sparkle);
  playSound(sparkle);
  statusText.textContent = `Sparkle ${Number(sparkle.dataset.index) + 1}`;
}

function sparkleFromPoint(event) {
  return document.elementFromPoint(event.clientX, event.clientY)?.closest(".sparkle");
}

sparklePad.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  activePointerId = event.pointerId;
  sparklePad.setPointerCapture(activePointerId);
  hitSparkle(sparkleFromPoint(event));
});

sparklePad.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointerId) {
    return;
  }

  event.preventDefault();
  hitSparkle(sparkleFromPoint(event));
});

function finishPointer(event) {
  if (event.pointerId !== activePointerId) {
    return;
  }

  activePointerId = null;
  lastSparkle = null;

  if ("vibrate" in navigator) {
    navigator.vibrate(0);
  }
}

sparklePad.addEventListener("pointerup", finishPointer);
sparklePad.addEventListener("pointercancel", finishPointer);

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "Sound On" : "Sound Off";
  soundButton.setAttribute("aria-pressed", String(soundEnabled));

  if (soundEnabled) {
    ensureAudio();
  }
});

createSparkles();
