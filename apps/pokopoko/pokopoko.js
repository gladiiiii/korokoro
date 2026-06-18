const bubblePad = document.querySelector("#bubblePad");
const soundButton = document.querySelector("#soundButton");
const popSlider = document.querySelector("#popSlider");
const sizeSlider = document.querySelector("#sizeSlider");
const statusText = document.querySelector("#statusText");

const AudioEngine = window.AudioContext || window.webkitAudioContext;
const colors = ["#f7c948", "#ef5b4a", "#4387f4", "#3bb273", "#26a6a6", "#e9548f"];
const bubbleCount = window.matchMedia("(max-width: 380px)").matches ? 18 : 24;

let audioContext;
let soundEnabled = true;
let activePointerId = null;
let lastBubble = null;

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

function bubbleSize(index) {
  const sizeBoost = Number(sizeSlider.value) * 5;
  return 42 + sizeBoost + (index % 5) * 7;
}

function placeBubble(bubble, index) {
  const column = index % 4;
  const row = Math.floor(index / 4);
  const jitterX = ((index * 29) % 19) - 9;
  const jitterY = ((index * 41) % 21) - 10;
  const x = 13 + column * 24 + jitterX;
  const y = 10 + row * (80 / Math.ceil(bubbleCount / 4)) + jitterY;
  const size = bubbleSize(index);

  bubble.style.setProperty("--x", `${Math.max(8, Math.min(92, x))}%`);
  bubble.style.setProperty("--y", `${Math.max(8, Math.min(92, y))}%`);
  bubble.style.setProperty("--size", `${size}px`);
  bubble.style.setProperty("--color", colors[index % colors.length]);
}

function createBubbles() {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < bubbleCount; index += 1) {
    const bubble = document.createElement("button");
    bubble.type = "button";
    bubble.className = "bubble";
    bubble.dataset.index = String(index);
    bubble.setAttribute("aria-label", `Bubble ${index + 1}`);
    placeBubble(bubble, index);
    fragment.append(bubble);
  }

  bubblePad.append(fragment);
}

function refreshBubbleSizes() {
  bubblePad.querySelectorAll(".bubble").forEach((bubble) => {
    placeBubble(bubble, Number(bubble.dataset.index));
  });
}

function vibrate(index) {
  if (!("vibrate" in navigator)) {
    statusText.textContent = "Visual mode";
    return;
  }

  const pop = Number(popSlider.value);
  navigator.vibrate([8 + pop * 5, 18, 6 + (index % 3) * 5]);
}

function playSound(index) {
  if (!soundEnabled || !ensureAudio()) {
    return;
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const pop = Number(popSlider.value);
  const startFrequency = 260 + index * 9 + pop * 42;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(startFrequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(90, startFrequency * 0.42), now + 0.16);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(700 + pop * 180, now);
  filter.Q.setValueAtTime(7, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.2);
}

function addRing(bubble) {
  const ring = document.createElement("span");
  ring.className = "pop-ring";
  ring.style.setProperty("--x", bubble.style.getPropertyValue("--x"));
  ring.style.setProperty("--y", bubble.style.getPropertyValue("--y"));
  ring.style.setProperty("--size", bubble.style.getPropertyValue("--size"));
  ring.style.setProperty("--color", bubble.style.getPropertyValue("--color"));
  bubblePad.append(ring);
  window.setTimeout(() => ring.remove(), 460);
}

function popBubble(bubble) {
  if (!bubble || !bubble.classList.contains("bubble") || bubble.classList.contains("pop-hidden")) {
    return;
  }

  if (bubble === lastBubble) {
    return;
  }

  const index = Number(bubble.dataset.index);
  lastBubble = bubble;

  bubble.classList.add("popping");
  addRing(bubble);
  vibrate(index);
  playSound(index);
  statusText.textContent = `Pop ${index + 1}`;

  window.setTimeout(() => {
    bubble.classList.add("pop-hidden");
    bubble.classList.remove("popping");
  }, 110);

  window.setTimeout(() => {
    placeBubble(bubble, (index + Number(popSlider.value) * 3) % bubbleCount);
    bubble.classList.remove("pop-hidden");
  }, 560);
}

function bubbleFromPoint(event) {
  return document.elementFromPoint(event.clientX, event.clientY)?.closest(".bubble");
}

bubblePad.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  activePointerId = event.pointerId;
  bubblePad.setPointerCapture(activePointerId);
  popBubble(bubbleFromPoint(event));
});

bubblePad.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointerId) {
    return;
  }

  event.preventDefault();
  popBubble(bubbleFromPoint(event));
});

function finishPointer(event) {
  if (event.pointerId !== activePointerId) {
    return;
  }

  activePointerId = null;
  lastBubble = null;

  if ("vibrate" in navigator) {
    navigator.vibrate(0);
  }
}

bubblePad.addEventListener("pointerup", finishPointer);
bubblePad.addEventListener("pointercancel", finishPointer);

sizeSlider.addEventListener("input", refreshBubbleSizes);

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "Sound On" : "Sound Off";
  soundButton.setAttribute("aria-pressed", String(soundEnabled));

  if (soundEnabled) {
    ensureAudio();
  }
});

createBubbles();
