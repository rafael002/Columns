const ScoreBoard = (function () {
  const SCORES_KEY = 'columns_scores';

  const GODS = [
    { name: 'ZEUS',       score: 100000 },
    { name: 'POSEIDON',   score:  85000 },
    { name: 'HADES',      score:  72000 },
    { name: 'HERMES',     score:  60000 },
    { name: 'ATHENA',     score:  48000 },
    { name: 'ARES',       score:  38000 },
    { name: 'APOLLO',     score:  29000 },
    { name: 'ARTEMIS',    score:  21000 },
    { name: 'DIONYSUS',   score:  14000 },
    { name: 'APHRODITE',  score:   9000 },
    { name: 'HEPHAESTUS', score:   5000 },
    { name: 'DEMETER',    score:   2000 },
  ];

  const GOD_NAMES = new Set(GODS.map(g => g.name));

  function _defaults() { return GODS.map(g => ({ ...g })); }

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(SCORES_KEY));
      if (Array.isArray(data) && data.length === 12) return data;
    } catch { /* ignore */ }
    return _defaults();
  }

  function _save(scores) {
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  }

  function qualifies(score) {
    if (score <= 0) return false;
    const scores = load();
    return score > scores[scores.length - 1].score;
  }

  function getRank(score) {
    const scores = load();
    const idx = scores.findIndex(e => score > e.score);
    return idx === -1 ? 12 : idx + 1;
  }

  function addScore(name, score) {
    const scores = load();
    scores.push({ name: (name.toUpperCase().trim() || 'PLAYER'), score });
    scores.sort((a, b) => b.score - a.score);
    scores.splice(12);
    _save(scores);
    return scores;
  }

  const LAUREL_COLORS = ['#f1c40f', '#b0b8c1', '#cd7f32'];

  function _laurel(color) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 26" width="36" height="22">
      <path d="M20 24 C11 21 6 15 8 7" stroke="${color}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="10" cy="19" rx="3.2" ry="1.4" fill="${color}" transform="rotate(-40 10 19)"/>
      <ellipse cx="8.5" cy="13" rx="3.2" ry="1.4" fill="${color}" transform="rotate(-18 8.5 13)"/>
      <ellipse cx="11" cy="8"  rx="3.2" ry="1.4" fill="${color}" transform="rotate(12 11 8)"/>
      <path d="M24 24 C33 21 38 15 36 7" stroke="${color}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="34" cy="19" rx="3.2" ry="1.4" fill="${color}" transform="rotate(40 34 19)"/>
      <ellipse cx="35.5" cy="13" rx="3.2" ry="1.4" fill="${color}" transform="rotate(18 35.5 13)"/>
      <ellipse cx="33" cy="8"  rx="3.2" ry="1.4" fill="${color}" transform="rotate(-12 33 8)"/>
    </svg>`;
  }

  function render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const scores = load();
    container.innerHTML = scores.map((entry, i) => {
      const isGod = GOD_NAMES.has(entry.name);
      const rankEl = i < 3
        ? `<span class="score-medal">${_laurel(LAUREL_COLORS[i])}</span>`
        : `<span class="score-rank">${String(i + 1).padStart(2, '0')}</span>`;
      return `<div class="score-entry${isGod ? ' score-entry--god' : ' score-entry--player'}">
        ${rankEl}
        <span class="score-name">${entry.name}</span>
        <span class="score-value">${entry.score.toLocaleString()}</span>
      </div>`;
    }).join('');
  }

  return { load, qualifies, getRank, addScore, render };
})();
