function renderBattledex() {
  const grid = document.getElementById('battledex-grid');
  const empty = document.getElementById('battledex-empty');
  const clearBtn = document.getElementById('battledex-clear');
  const backBtn = document.getElementById('battledex-back-to-fight');
  const fighters = loadBattledex();

  grid.innerHTML = '';
  fighters.forEach((fighter, index) => {
    const card = document.createElement('div');
    card.className = 'battledex-card';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'battledex-card-delete';
    deleteBtn.textContent = '✕';
    deleteBtn.setAttribute('aria-label', `Delete ${fighter.label}`);
    deleteBtn.addEventListener('click', () => {
      deleteFighter(index);
      renderBattledex();
    });

    const img = document.createElement('img');
    img.src = fighter.image;
    img.alt = fighter.label;

    const name = document.createElement('p');
    name.textContent = fighter.label;

    card.append(deleteBtn, img, name);
    grid.appendChild(card);
  });

  empty.hidden = fighters.length > 0;
  clearBtn.hidden = fighters.length === 0;
  backBtn.hidden = !loadLastFight();
}

document.getElementById('battledex-back-to-fight').addEventListener('click', () => {
  location.href = 'index.html?view=result';
});

document.getElementById('battledex-clear').addEventListener('click', () => {
  saveBattledex([]);
  renderBattledex();
});

renderBattledex();
