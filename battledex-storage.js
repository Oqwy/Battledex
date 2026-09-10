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

function saveFighter(label, image) {
  const fighters = loadBattledex();
  fighters.push({ label, image });
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
