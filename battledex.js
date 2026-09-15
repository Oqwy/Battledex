// Cycled per card for the arcade-cabinet tinted border look.
const CARD_TINTS = ['#9bf9ff', '#f51767', '#32dd88', '#4c0ffb'];

function renderBattledex() {
  const grid = document.getElementById('battledex-grid');
  const empty = document.getElementById('battledex-empty');
  const clearBtn = document.getElementById('battledex-clear');
  const backBtn = document.getElementById('battledex-back-to-fight');
  const rosterCount = document.getElementById('roster-count-text');
  const fighters = loadBattledex();

  rosterCount.textContent = `${fighters.length} ON ROSTER`;

  grid.innerHTML = '';
  fighters.forEach((fighter, index) => {
    const card = document.createElement('div');
    card.className = 'battledex-card';
    card.style.setProperty('--tint', CARD_TINTS[index % CARD_TINTS.length]);

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

    const no = document.createElement('div');
    no.className = 'battledex-card-no';
    no.textContent = `NO.${String(index + 1).padStart(3, '0')}`;

    card.append(deleteBtn, img, name, no);
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
