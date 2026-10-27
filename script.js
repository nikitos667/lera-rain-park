const audio = document.getElementById('song');
const playButton = document.getElementById('play-button');
const playIcon = document.getElementById('play-icon');
const progress = document.getElementById('progress');
const currentTimeLabel = document.getElementById('current-time');
const durationLabel = document.getElementById('duration');
const player = document.querySelector('.player');

const formatTime = seconds => {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

const syncPlayer = () => {
  const playing = !audio.paused;
  player.classList.toggle('playing', playing);
  playButton.setAttribute('aria-label', playing ? 'Приостановить музыку' : 'Включить музыку');
  playIcon.innerHTML = playing
    ? '<path d="M7 5h3v14H7zm7 0h3v14h-3z"/>'
    : '<path d="M8 5.6a1 1 0 0 1 1.5-.86l9.4 6.4a1 1 0 0 1 0 1.72l-9.4 6.4A1 1 0 0 1 8 18.4V5.6Z"/>';
};

playButton.addEventListener('click', async () => {
  if (audio.paused) {
    try { await audio.play(); }
    catch { playButton.setAttribute('aria-label', 'Не удалось включить музыку'); }
  } else audio.pause();
});
audio.addEventListener('play', syncPlayer);
audio.addEventListener('pause', syncPlayer);
audio.addEventListener('ended', syncPlayer);
audio.addEventListener('loadedmetadata', () => { durationLabel.textContent = formatTime(audio.duration); });
audio.addEventListener('timeupdate', () => {
  currentTimeLabel.textContent = formatTime(audio.currentTime);
  const value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  progress.value = String(value);
  progress.style.setProperty('--progress', `${value}%`);
});
progress.addEventListener('input', () => {
  if (audio.duration) audio.currentTime = (Number(progress.value) / 100) * audio.duration;
  progress.style.setProperty('--progress', `${progress.value}%`);
});

const overlay = document.getElementById('letter-overlay');
const openLetter = document.getElementById('open-letter');
const closeLetter = document.getElementById('close-letter');
const backdrop = document.getElementById('letter-backdrop');
const dialog = document.querySelector('.letter-dialog');
const showLetter = () => {
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  closeLetter.focus();
};
const hideLetter = () => {
  overlay.hidden = true;
  document.body.style.overflow = '';
  openLetter.focus();
};
openLetter.addEventListener('click', showLetter);
closeLetter.addEventListener('click', hideLetter);
backdrop.addEventListener('click', hideLetter);
document.addEventListener('keydown', event => {
  if (overlay.hidden) return;
  if (event.key === 'Escape') hideLetter();
  if (event.key === 'Tab') {
    const focusables = [...dialog.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])')];
    const first = focusables[0], last = focusables.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

const canvas = document.getElementById('rain');
const ctx = canvas.getContext('2d');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let drops = [];
let raf = 0;
let width = 0;
let height = 0;
let dpr = 1;

const makeDrop = (randomY = false) => ({
  x: Math.random() * width,
  y: randomY ? Math.random() * height : -20,
  length: 7 + Math.random() * 17,
  speed: 5 + Math.random() * 7,
  alpha: .08 + Math.random() * .2,
  thickness: .35 + Math.random() * .75
});

function resizeRain() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drops = Array.from({ length: Math.min(150, Math.floor(width * .1)) }, () => makeDrop(true));
}

function drawRain() {
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = 'round';
  for (let i = 0; i < drops.length; i++) {
    const drop = drops[i];
    ctx.strokeStyle = `rgba(215,233,237,${drop.alpha})`;
    ctx.lineWidth = drop.thickness;
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x - drop.length * .27, drop.y + drop.length);
    ctx.stroke();
    drop.x -= drop.speed * .27;
    drop.y += drop.speed;
    if (drop.y > height + 30 || drop.x < -30) drops[i] = makeDrop();
  }
  raf = requestAnimationFrame(drawRain);
}

function syncRain() {
  cancelAnimationFrame(raf);
  if (reduceMotion.matches) { ctx.clearRect(0, 0, width, height); return; }
  drawRain();
}
resizeRain();
syncRain();
window.addEventListener('resize', resizeRain);
reduceMotion.addEventListener('change', syncRain);
