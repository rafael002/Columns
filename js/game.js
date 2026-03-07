(function() {
  const boardElement = document.getElementById('game-board');
  if (!boardElement) {
    console.error('game-board element not found!');
    return;
  }

  if (typeof CONFIG === 'undefined') {
    console.error('CONFIG não está definido! Verifique se constants.js está carregado.');
    return;
  }

  if (typeof Board === 'undefined' || typeof Piece === 'undefined' || typeof Screen === 'undefined') {
    console.error('Classes não estão definidas! Verifique se os scripts estão carregados.');
    return;
  }

  console.log('Iniciando jogo...');

  const game = new Game(boardElement);
  window.game = game;

  console.log('Jogo iniciado!', game);

  // ── Modo 1×1 ──
  document.getElementById('btn-1x1')?.addEventListener('click', () => {
    if (window.game2) return;

    document.getElementById('board-wrapper-p2').style.display = '';
    document.getElementById('side-panel-p2').style.display = '';
    document.getElementById('main-area').classList.add('two-player');

    window.game2 = new Game(document.getElementById('game-board-p2'), {
      scoreId:       'score-p2',
      gemsId:        'gems-p2',
      levelId:       'level-p2',
      nextPreviewId: 'next-piece-preview-p2',
      gameOverId:    'game-over-p2',
      finalScoreId:  'final-score-p2',
      retryBtnId:    'retry-btn-p2',
      keys: { LEFT: 65, RIGHT: 68, DOWN: 83, SHUFFLE: 87 }, // A, D, S, W
    });

    document.getElementById('btn-1x1').disabled = true;
    console.log('Modo 1×1 iniciado!', window.game2);
  });
})();
