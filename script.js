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

function showResult({ winner, reasoning, imageA, imageB }) {
  document.getElementById('result-winner').textContent = `${winner} wins!`;
  document.getElementById('result-reasoning').textContent = reasoning;
  document.getElementById('result-image-a').src = imageA;
  document.getElementById('result-image-b').src = imageB;
  showView('result');
}

function showError(message) {
  document.getElementById('error-message').textContent = message;
  showView('error');
}

// Stage 1: fake fight, no network call yet. Stage 3 swaps this for a real fetch to /api/fight.
function runFight(fighterA, fighterB) {
  showView('loading');
  setTimeout(() => {
    showResult({
      winner: fighterA,
      reasoning: `${fighterA} defeats ${fighterB} in a stunning upset (placeholder reasoning).`,
      imageA: 'https://placehold.co/200x200?text=' + encodeURIComponent(fighterA),
      imageB: 'https://placehold.co/200x200?text=' + encodeURIComponent(fighterB),
    });
  }, 1200);
}

document.getElementById('fight-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const fighterA = document.getElementById('fighter-a').value.trim();
  const fighterB = document.getElementById('fighter-b').value.trim();
  runFight(fighterA, fighterB);
});

document.getElementById('result-again').addEventListener('click', () => showView('form'));
document.getElementById('error-again').addEventListener('click', () => showView('form'));
