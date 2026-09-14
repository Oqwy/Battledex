const views = {
  form: document.getElementById('view-form'),
  loading: document.getElementById('view-loading'),
  result: document.getElementById('view-result'),
  error: document.getElementById('view-error'),
};

function showView(name) {
  for (const key in views) {
    views[key].hidden = key !== name;
  }
}

function resetSaveButton(btn) {
  btn.disabled = false;
  btn.textContent = 'Save to BattleDex';
}

function showResult({ winner, reasoning, imageA, imageB, fighterA, fighterB }) {
  saveLastFight({ winner, reasoning, imageA, imageB, fighterA, fighterB });
  document.getElementById('result-winner').textContent = `${winner} wins!`;
  document.getElementById('result-reasoning').textContent = reasoning;
  document.getElementById('result-image-a').src = imageA;
  document.getElementById('result-image-b').src = imageB;
  resetSaveButton(document.getElementById('save-fighter-a'));
  resetSaveButton(document.getElementById('save-fighter-b'));
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
    showError('Network error — check your connection and try again.');
    return;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    showError(data.error || 'Something went wrong.');
    return;
  }

  showResult({
    winner: data.winner,
    reasoning: data.reasoning,
    imageA: data.imageA,
    imageB: data.imageB,
    fighterA,
    fighterB,
  });
}

document.getElementById('fight-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const fighterA = document.getElementById('fighter-a').value.trim();
  const fighterB = document.getElementById('fighter-b').value.trim();
  runFight(fighterA, fighterB);
});

document.getElementById('result-again').addEventListener('click', () => showView('form'));
document.getElementById('error-again').addEventListener('click', () => showView('form'));

async function handleSave(button, label, image) {
  button.disabled = true;
  button.textContent = 'Saving...';
  try {
    await saveFighter(label, image);
    button.textContent = 'Saved!';
  } catch {
    button.disabled = false;
    button.textContent = 'Save failed — retry';
  }
}

document.getElementById('save-fighter-a').addEventListener('click', (e) => {
  const lastFight = loadLastFight();
  if (!lastFight) return;
  handleSave(e.target, lastFight.fighterA, lastFight.imageA);
});
document.getElementById('save-fighter-b').addEventListener('click', (e) => {
  const lastFight = loadLastFight();
  if (!lastFight) return;
  handleSave(e.target, lastFight.fighterB, lastFight.imageB);
});

// Arriving from battledex.html's "Back to last fight" link (?view=result).
if (new URLSearchParams(location.search).get('view') === 'result') {
  const lastFight = loadLastFight();
  if (lastFight) showResult(lastFight);
}
