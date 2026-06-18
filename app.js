const patterns = {
  roll: [24, 44, 24, 92],
  bounce: [70, 60, 110, 180],
  pulse: [140, 80, 140, 260],
};

const orb = document.querySelector("#orb");
const playButton = document.querySelector("#playButton");
const tapButton = document.querySelector("#tapButton");
const tempo = document.querySelector("#tempo");
const tempoOutput = document.querySelector("#tempoOutput");
const statusText = document.querySelector("#statusText");
const patternButtons = [...document.querySelectorAll(".pattern-button")];

let activePattern = "roll";
let timer = null;

function canVibrate() {
  return "vibrate" in navigator;
}

function beatLength() {
  return Math.round(60000 / Number(tempo.value));
}

function setTempo() {
  tempoOutput.value = tempo.value;
  document.documentElement.style.setProperty("--tempo", `${beatLength() * 4}ms`);

  if (timer) {
    stop();
    start();
  }
}

function vibrateOnce() {
  orb.classList.add("hit");
  window.setTimeout(() => orb.classList.remove("hit"), 150);

  if (canVibrate()) {
    navigator.vibrate(patterns[activePattern]);
    statusText.textContent = "振動を再生しています。";
  } else {
    statusText.textContent = "この端末は振動に非対応です。画面の動きで再生しています。";
  }
}

function start() {
  vibrateOnce();
  orb.classList.add("playing");
  playButton.textContent = "Stop";
  timer = window.setInterval(vibrateOnce, beatLength() * 2);
}

function stop() {
  window.clearInterval(timer);
  timer = null;
  orb.classList.remove("playing");
  playButton.textContent = "Start";

  if (canVibrate()) {
    navigator.vibrate(0);
  }

  statusText.textContent = "停止しました。";
}

patternButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activePattern = button.dataset.pattern;

    patternButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    if (timer) {
      vibrateOnce();
    }
  });
});

playButton.addEventListener("click", () => {
  if (timer) {
    stop();
    return;
  }

  start();
});

tapButton.addEventListener("click", vibrateOnce);
tempo.addEventListener("input", setTempo);
setTempo();
