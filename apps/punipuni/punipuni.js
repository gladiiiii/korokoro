const puniPad = document.querySelector("#puniPad");
const soundButton = document.querySelector("#soundButton");
const puniSlider = document.querySelector("#puniSlider");
const sizeSlider = document.querySelector("#sizeSlider");
const statusText = document.querySelector("#statusText");

const AudioEngine = window.AudioContext || window.webkitAudioContext;
const colors = ["#e9548f", "#7c5cff", "#26a6a6", "#f7c948", "#ef5b4a", "#3bb273"];
const marks = ["ぷに", "むに", "もち", "ぽよ", "ぷよ"];
const puniCount = window.matchMedia("(max-width: 380px)").matches ? 14 : 18;

let audioContext;
let soundEnabled = true;
let activePointerId = null;
let lastPuni = null;

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

function puniSize(index) {
  const sizeBoost = Number(sizeSlider.value) * 7;
  return 54 + sizeBoost + (index % 4) * 8;
}

function placePuni(puni, index) {
  const column = index % 3;
  const row = Math.floor(index / 3);
  const jitterX = ((index * 31) % 23) - 11;
  const jitterY = ((index * 43) % 27) - 13;
  const x = 17 + column * 32 + jitterX;
  const y = 12 + row * (80 / Math.ceil(puniCount / 3)) + jitterY;
  const size = puniSize(index);

  puni.style.setProperty("--x", `${Math.max(10, Math.min(90, x))}%`);
  puni.style.setProperty("--y", `${Math.max(10, Math.min(90, y))}%`);
  puni.style.setProperty("--size", `${size}px`);
  puni.style.setProperty("--color", colors[index % colors.length]);
}

function createPunis() {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < puniCount; index += 1) {
    const puni = document.createElement("button");
    puni.type = "button";
    puni.className = "puni";
    puni.dataset.index = String(index);
    puni.setAttribute("aria-label", `Puni ${index + 1}`);
    placePuni(puni, index);
    fragment.append(puni);
  }

  puniPad.append(fragment);
}

function refreshPuniSizes() {
  puniPad.querySelectorAll(".puni").forEach((puni) => {
    placePuni(puni, Number(puni.dataset.index));
  });
}

function vibrate(index) {
  if (!("vibrate" in navigator)) {
    statusText.textContent = "Visual mode";
    return;
  }

  const puni = Number(puniSlider.value);
  navigator.vibrate([12 + puni * 6, 26, 10 + (index % 3) * 4]);
}

function playSound(index) {
  if (!soundEnabled || !ensureAudio()) {
    return;
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const depth = Number(puniSlider.value);
  const startFrequency = 220 + index * 8 + depth * 24;

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(startFrequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(startFrequency * 0.72, now + 0.08);
  oscillator.frequency.exponentialRampToValueAtTime(startFrequency * 1.05, now + 0.18);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(540 + depth * 120, now);
  filter.Q.setValueAtTime(5, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.04, now + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.3);
}

function addNote(puni, index) {
  const note = document.createElement("span");
  note.className = "puni-note";
  note.textContent = marks[index % marks.length];
  note.style.setProperty("--x", puni.style.getPropertyValue("--x"));
  note.style.setProperty("--y", puni.style.getPropertyValue("--y"));
  puniPad.append(note);
  window.setTimeout(() => note.remove(), 560);
}

function squishPuni(puni) {
  if (!puni || !puni.classList.contains("puni")) {
    return;
  }

  if (puni === lastPuni) {
    return;
  }

  const index = Number(puni.dataset.index);
  lastPuni = puni;

  puni.classList.add("squish");
  addNote(puni, index);
  vibrate(index);
  playSound(index);
  statusText.textContent = `Puni ${index + 1}`;

  window.setTimeout(() => {
    puni.classList.remove("squish");
  }, 180);
}

function puniFromPoint(event) {
  return document.elementFromPoint(event.clientX, event.clientY)?.closest(".puni");
}

puniPad.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  activePointerId = event.pointerId;
  puniPad.setPointerCapture(activePointerId);
  squishPuni(puniFromPoint(event));
});

puniPad.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointerId) {
    return;
  }

  event.preventDefault();
  squishPuni(puniFromPoint(event));
});

function finishPointer(event) {
  if (event.pointerId !== activePointerId) {
    return;
  }

  activePointerId = null;
  lastPuni = null;

  if ("vibrate" in navigator) {
    navigator.vibrate(0);
  }
}

puniPad.addEventListener("pointerup", finishPointer);
puniPad.addEventListener("pointercancel", finishPointer);

sizeSlider.addEventListener("input", refreshPuniSizes);

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "Sound On" : "Sound Off";
  soundButton.setAttribute("aria-pressed", String(soundEnabled));

  if (soundEnabled) {
    ensureAudio();
  }
});

createPunis();
