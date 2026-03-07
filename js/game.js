(function () {
  if (typeof CONFIG === 'undefined') {
    console.error('CONFIG não está definido!'); return;
  }
  if (typeof Board === 'undefined' || typeof Piece === 'undefined' || typeof Screen === 'undefined') {
    console.error('Classes não estão definidas!'); return;
  }

  // ── Navegação entre telas ──────────────────────────────────────────────────

  function showGame() {
    document.getElementById('screen-menu').style.display = 'none';
    document.getElementById('game-wrapper').style.display = '';
  }

  document.getElementById('btn-settings').addEventListener('click', () => {
    document.getElementById('screen-menu').style.display = 'none';
    document.getElementById('screen-settings').style.display = 'flex';
  });

  document.getElementById('btn-back').addEventListener('click', () => {
    document.getElementById('screen-settings').style.display = 'none';
    document.getElementById('screen-menu').style.display = 'flex';
  });

  // ── Modos de jogo ─────────────────────────────────────────────────────────

  document.getElementById('btn-1p').addEventListener('click', () => {
    showGame();
    window.game = new Game(document.getElementById('game-board'));
  });

  document.getElementById('btn-2p').addEventListener('click', () => {
    document.getElementById('board-wrapper-p2').style.display = '';
    document.getElementById('side-panel-p2').style.display = '';
    document.getElementById('main-area').classList.add('two-player');
    showGame();

    window.game = new Game(document.getElementById('game-board'), { label: '1P' });

    window.game2 = new Game(document.getElementById('game-board-p2'), {
      scoreId:       'score-p2',
      gemsId:        'gems-p2',
      levelId:       'level-p2',
      nextPreviewId: 'next-piece-preview-p2',
      gameOverId:    'game-over',
      finalScoreId:  'final-score',
      retryBtnId:    'retry-btn',
      titleId:       'modal-title',
      keys:  { LEFT: 65, RIGHT: 68, DOWN: 83, SHUFFLE: 87 }, // A, D, S, W
      label: '2P',
    });

    window.game.setPeer(window.game2);
    window.game2.setPeer(window.game);
  });
})();
