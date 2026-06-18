const wavePad = document.querySelector("#wavePad");
const soundButton = document.querySelector("#soundButton");
const swellSlider = document.querySelector("#swellSlider");
const tideSlider = document.querySelector("#tideSlider");
const statusText = document.querySelector("#statusText");

const AudioEngine = window.AudioContext || window.webkitAudioContext;
const notes = [147, 165, 196, 220, 247, 294, 330, 392];

let audioContext;
let soundEnabled = true;
let activePointerId = null;
let lastHitAt = 0;

function createBands() {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 5; index += 1) {
    const band = document.createElement("span");
    band.className = "wave-band";
    fragment.append(band);
  }

  wavePad.append(fragment);
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

function positionFor(event) {
  const rect = wavePad.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
  };
}

function vibrate(point) {
  if (!("vibrate" in navigator)) {
    statusText.textContent = "Visual mode";
    return;
  }

  const swell = Number(swellSlider.value);
  const pulse = 12 + swell * 8 + Math.round(point.y * 18);
  navigator.vibrate([pulse, 18, Math.max(10, pulse - 10)]);
}

function playSound(point) {
  if (!soundEnabled || !ensureAudio()) {
    return;
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const tide = Number(tideSlider.value);
  const noteIndex = Math.min(notes.length - 1, Math.floor((1 - point.y) * notes.length));

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(notes[noteIndex] + point.x * 28 + tide * 5, now);
  oscillator.frequency.exponentialRampToValueAtTime(notes[noteIndex] * 0.86 + tide * 4, now + 0.32);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(620 + tide * 260 + point.x * 360, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.44);
}

function addRipple(point) {
  const size = 110 + Number(swellSlider.value) * 32;
  const ripple = document.createElement("span");
  const mark = document.createElement("span");

  ripple.className = "wave-ripple";
  ripple.style.setProperty("--x", `${point.x * 100}%`);
  ripple.style.setProperty("--y", `${point.y * 100}%`);
  ripple.style.setProperty("--size", `${size}px`);

  mark.className = "wave-mark";
  mark.style.setProperty("--x", `${point.x * 100}%`);
  mark.style.setProperty("--y", `${point.y * 100}%`);
  mark.style.setProperty("--angle", `${-24 + point.x * 48}deg`);

  wavePad.append(ripple, mark);
  window.setTimeout(() => {
    ripple.remove();
    mark.remove();
  }, 680);
}

function hitWave(event, force = false) {
  const now = performance.now();

  if (!force && now - lastHitAt < 95) {
    return;
  }

  lastHitAt = now;
  const point = positionFor(event);

  addRipple(point);
  vibrate(point);
  playSound(point);
  statusText.textContent = `Wave ${Math.round(point.x * 100)}:${Math.round((1 - point.y) * 100)}`;
}

wavePad.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  activePointerId = event.pointerId;
  wavePad.setPointerCapture(activePointerId);
  hitWave(event, true);
});

wavePad.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointerId) {
    return;
  }

  event.preventDefault();
  hitWave(event);
});

function finishPointer(event) {
  if (event.pointerId !== activePointerId) {
    return;
  }

  activePointerId = null;

  if ("vibrate" in navigator) {
    navigator.vibrate(0);
  }
}

wavePad.addEventListener("pointerup", finishPointer);
wavePad.addEventListener("pointercancel", finishPointer);

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "Sound On" : "Sound Off";
  soundButton.setAttribute("aria-pressed", String(soundEnabled));

  if (soundEnabled) {
    ensureAudio();
  }
});

createBands();
