const views = {
  form: document.getElementById('view-form'),
  loading: document.getElementById('view-loading'),
  result: document.getElementById('view-result'),
  error: document.getElementById('view-error'),
};

const LOADING_MESSAGES = [
  'Sharpening claws...',
  'Consulting the ancient scrolls...',
  'Taping up the gloves...',
  'Warming up the crowd...',
  'Measuring the trash talk...',
  'Rolling the dramatic entrance...',
  'Checking the arena for weak floorboards...',
  'Summoning the announcer...',
  'Placing side bets...',
  'Judge is putting on the ceremonial robe...',
];

let loadingInterval = null;

function startLoadingMessages() {
  const el = document.getElementById('loading-message');
  let i = 0;
  el.textContent = LOADING_MESSAGES[i];
  loadingInterval = setInterval(() => {
    i = (i + 1) % LOADING_MESSAGES.length;
    el.textContent = LOADING_MESSAGES[i];
  }, 1800);
}

function stopLoadingMessages() {
  clearInterval(loadingInterval);
  loadingInterval = null;
}

function showView(name) {
  for (const key in views) {
    views[key].hidden = key !== name;
  }
  if (name === 'loading') {
    startLoadingMessages();
  } else {
    stopLoadingMessages();
  }
}

const ART_PLACEHOLDER_TEXT = {
  moderation: 'ART BENCHED BY THE CENSORS',
  failed: 'SKETCH ARTIST NO-SHOW',
};

function resetSaveButton(btn, hasImage) {
  // BattleDex entries are { label, image } — nothing to save without art.
  btn.disabled = !hasImage;
  btn.textContent = hasImage ? 'SAVE TO DEX' : 'NO ART TO SAVE';
}

// Shows the fighter's image, or placeholder text in the same slot if the
// image failed or was moderation-blocked.
function setFighterArt(imgId, placeholderId, image, imageError) {
  const img = document.getElementById(imgId);
  const placeholder = document.getElementById(placeholderId);
  img.hidden = !image;
  img.src = image || '';
  placeholder.hidden = Boolean(image);
  placeholder.textContent = image ? '' : ART_PLACEHOLDER_TEXT[imageError] || ART_PLACEHOLDER_TEXT.failed;
}

function setFighterOutcome(slotId, nameId, label, isWinner) {
  const slot = document.getElementById(slotId);
  slot.classList.toggle('is-winner', isWinner);
  slot.classList.toggle('is-defeat', !isWinner);
  slot.querySelector('.fighter-tag').textContent = isWinner ? 'WINNER' : 'DEFEAT';
  document.getElementById(nameId).textContent = label;
}

function showResult({ winner, reasoning, imageA, imageB, imageErrorA, imageErrorB, fighterA, fighterB }) {
  saveLastFight({ winner, reasoning, imageA, imageB, imageErrorA, imageErrorB, fighterA, fighterB });
  const aWins = winner === fighterA;
  document.getElementById('result-winner').textContent = `${winner} wins!`;
  document.getElementById('result-reasoning').textContent = reasoning;
  setFighterArt('result-image-a', 'placeholder-a', imageA, imageErrorA);
  setFighterArt('result-image-b', 'placeholder-b', imageB, imageErrorB);
  setFighterOutcome('slot-a', 'name-a', fighterA, aWins);
  setFighterOutcome('slot-b', 'name-b', fighterB, !aWins);
  resetSaveButton(document.getElementById('save-fighter-a'), Boolean(imageA));
  resetSaveButton(document.getElementById('save-fighter-b'), Boolean(imageB));
  showView('result');
}

function showError(message) {
  document.getElementById('error-message').textContent = message;
  showView('error');
}

// Stage 3: real verdict + art via /api/fight.
async function runFight(fighterA, fighterB) {
  showView('loading');
  let res;
  try {
    res = await fetch('/api/fight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fighterA, fighterB }),
    });
  } catch (err) {
    showError("Lost the signal to the arena — check your connection and try again.");
    return;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    showError(data.error || 'The ref threw a flag. Something went sideways — try again.');
    return;
  }

  showResult({
    winner: data.winner,
    reasoning: data.reasoning,
    imageA: data.imageA,
    imageB: data.imageB,
    imageErrorA: data.imageErrorA,
    imageErrorB: data.imageErrorB,
    fighterA,
    fighterB,
  });
}

document.getElementById('fight-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const fighterA = document.getElementById('fighter-a').value.trim();
  const fighterB = document.getElementById('fighter-b').value.trim();
  if (!fighterA || !fighterB) {
    showError("Can't have a fight with an empty corner — enter both fighters.");
    return;
  }
  runFight(fighterA, fighterB);
});

function updateFormReadiness() {
  const ready = document.getElementById('fighter-a').value.trim() && document.getElementById('fighter-b').value.trim();
  document.getElementById('view-form').classList.toggle('ready', ready);
  document.getElementById('form-tagline').textContent = ready ? 'READY TO FIGHT' : 'SELECT YOUR FIGHTERS';
  document.getElementById('form-hint').textContent = ready ? 'PRESS TO BEGIN' : 'BOTH SLOTS REQUIRED';
}
document.getElementById('fighter-a').addEventListener('input', updateFormReadiness);
document.getElementById('fighter-b').addEventListener('input', updateFormReadiness);

document.getElementById('result-again').addEventListener('click', () => showView('form'));
document.getElementById('error-again').addEventListener('click', () => showView('form'));

async function handleSave(button, label, image) {
  button.disabled = true;
  button.textContent = 'SAVING...';
  try {
    await saveFighter(label, image);
    button.textContent = 'SAVED!';
  } catch {
    button.disabled = false;
    button.textContent = 'SAVE FAILED — RETRY';
  }
}

document.getElementById('save-fighter-a').addEventListener('click', (e) => {
  const lastFight = loadLastFight();
  if (!lastFight?.imageA) return;
  handleSave(e.target, lastFight.fighterA, lastFight.imageA);
});
document.getElementById('save-fighter-b').addEventListener('click', (e) => {
  const lastFight = loadLastFight();
  if (!lastFight?.imageB) return;
  handleSave(e.target, lastFight.fighterB, lastFight.imageB);
});

// Arriving from battledex.html's "Back to last fight" link (?view=result).
if (new URLSearchParams(location.search).get('view') === 'result') {
  const lastFight = loadLastFight();
  if (lastFight) showResult(lastFight);
}
