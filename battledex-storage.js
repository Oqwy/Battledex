// Shared localStorage helpers, used by both index.html and battledex.html.
const BATTLEDEX_KEY = 'battledex';
const LAST_FIGHT_KEY = 'lastFight';

function loadBattledex() {
  try {
    return JSON.parse(localStorage.getItem(BATTLEDEX_KEY)) || [];
  } catch {
    return [];
  }
}

function saveBattledex(fighters) {
  localStorage.setItem(BATTLEDEX_KEY, JSON.stringify(fighters));
}

const SAVED_IMAGE_MAX_DIMENSION = 200;
const SAVED_IMAGE_QUALITY = 0.7;

// Resize + re-encode as JPEG via an off-screen canvas, to stay under localStorage quota.
function compressImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, SAVED_IMAGE_MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', SAVED_IMAGE_QUALITY));
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = src;
  });
}

async function saveFighter(label, image) {
  const compressed = await compressImage(image);
  const fighters = loadBattledex();
  fighters.push({ label, image: compressed });
  saveBattledex(fighters);
}

function deleteFighter(index) {
  const fighters = loadBattledex();
  fighters.splice(index, 1);
  saveBattledex(fighters);
}

function loadLastFight() {
  try {
    return JSON.parse(localStorage.getItem(LAST_FIGHT_KEY));
  } catch {
    return null;
  }
}

function saveLastFight(fight) {
  localStorage.setItem(LAST_FIGHT_KEY, JSON.stringify(fight));
}
