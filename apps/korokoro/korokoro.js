const pad = document.querySelector("#pad");
const soundButton = document.querySelector("#soundButton");
const feelSlider = document.querySelector("#feelSlider");
const toneSlider = document.querySelector("#toneSlider");
const statusText = document.querySelector("#statusText");

const columns = window.matchMedia("(max-width: 380px)").matches ? 5 : 6;
const rows = window.matchMedia("(max-width: 380px)").matches ? 11 : 10;
const tileCount = columns * rows;
const notes = [196, 220, 247, 262, 294, 330, 370, 392, 440, 494, 523, 587];
const AudioEngine = window.AudioContext || window.webkitAudioContext;

let audioContext;
let soundEnabled = true;
let activePointerId = null;
let lastTile = null;
let lastHitAt = 0;

function createTiles() {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < tileCount; index += 1) {
    const tile = document.createElement("button");
    const x = index % columns;
    const y = Math.floor(index / columns);
    const band = (x + y) % 7;

    tile.type = "button";
    tile.className = "tile";
    tile.dataset.index = String(index);
    tile.dataset.x = String(x);
    tile.dataset.y = String(y);
    tile.dataset.band = String(band);
    tile.setAttribute("aria-label", `Pad ${index + 1}`);

    fragment.append(tile);
  }

  pad.append(fragment);
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

function noteFor(tile) {
  const x = Number(tile.dataset.x);
  const y = Number(tile.dataset.y);
  const toneOffset = Number(toneSlider.value) - 3;
  const noteIndex = (rows - 1 - y + x + toneOffset + notes.length) % notes.length;

  return notes[noteIndex];
}

function vibrate(tile) {
  if (!("vibrate" in navigator)) {
    statusText.textContent = "Visual mode";
    return;
  }

  const x = Number(tile.dataset.x);
  const y = Number(tile.dataset.y);
  const feel = Number(feelSlider.value);
  const duration = 10 + feel * 7 + ((x + y) % 3) * 8;

  navigator.vibrate(duration);
}

function playSound(tile) {
  if (!soundEnabled || !ensureAudio()) {
    return;
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(noteFor(tile), now);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800 + Number(toneSlider.value) * 420, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.18);
}

function flash(tile) {
  tile.classList.add("active");
  window.setTimeout(() => tile.classList.remove("active"), 140);
}

function hitTile(tile) {
  if (!tile || !tile.classList.contains("tile")) {
    return;
  }

  const now = performance.now();

  if (tile === lastTile && now - lastHitAt < 90) {
    return;
  }

  lastTile = tile;
  lastHitAt = now;

  flash(tile);
  vibrate(tile);
  playSound(tile);

  const index = Number(tile.dataset.index) + 1;
  statusText.textContent = `Pad ${index}`;
}

function tileFromPoint(event) {
  return document.elementFromPoint(event.clientX, event.clientY)?.closest(".tile");
}

pad.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  activePointerId = event.pointerId;
  pad.setPointerCapture(activePointerId);
  hitTile(tileFromPoint(event));
});

pad.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointerId) {
    return;
  }

  event.preventDefault();
  hitTile(tileFromPoint(event));
});

function finishPointer(event) {
  if (event.pointerId !== activePointerId) {
    return;
  }

  activePointerId = null;
  lastTile = null;

  if ("vibrate" in navigator) {
    navigator.vibrate(0);
  }
}

pad.addEventListener("pointerup", finishPointer);
pad.addEventListener("pointercancel", finishPointer);

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "Sound On" : "Sound Off";
  soundButton.setAttribute("aria-pressed", String(soundEnabled));

  if (soundEnabled) {
    ensureAudio();
  }
});

createTiles();
