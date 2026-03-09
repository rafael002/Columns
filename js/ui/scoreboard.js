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

  function render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const scores = load();
    const MEDALS = ['🥇', '🥈', '🥉'];
    container.innerHTML = scores.map((entry, i) => {
      const isGod = GOD_NAMES.has(entry.name);
      const rankEl = i < 3
        ? `<span class="score-medal">${MEDALS[i]}</span>`
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
