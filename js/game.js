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

  function goToMenu() {
    // Para os loops de todos os jogos ativos
    [window.game, window.game2].forEach(g => {
      if (!g) return;
      clearInterval(g._updateLoopId);
      g._updateLoopId = null;
      g.gameOver = true;
      g._countdownGen++;
    });
    window.game = null;
    window.game2 = null;

    // Reseta a UI do jogo
    document.getElementById('game-over').classList.remove('visible', 'paused', 'confirming');
    document.getElementById('board-wrapper-p2').style.display = 'none';
    document.getElementById('side-panel-p2').style.display = 'none';
    document.getElementById('main-area').classList.remove('two-player');
    document.getElementById('game-wrapper').style.display = 'none';

    document.getElementById('screen-menu').style.display = 'flex';
  }

  // ── Confirmação de saída ───────────────────────────────────────────────────

  let _savedOverlayClasses = '';
  let _pausedByConfirm     = false;

  function showConfirm() {
    const overlay = document.getElementById('game-over');

    // Salva estado atual do overlay para restaurar se cancelar
    _savedOverlayClasses = overlay.className;

    // Pausa silenciosamente se o jogo estiver rodando
    _pausedByConfirm = false;
    if (window.game && !window.game.gameOver && !window.game.isPaused) {
      window.game.pauseSilent();
      window.game2?.pauseSilent();
      _pausedByConfirm = true;
    }

    document.getElementById('modal-title').textContent = 'DESEJA REALMENTE SAIR?';
    overlay.className = 'game-over visible confirming';
  }

  function cancelConfirm() {
    const overlay = document.getElementById('game-over');
    overlay.className = _savedOverlayClasses;

    if (_pausedByConfirm) {
      window.game?.resumeSilent();
      window.game2?.resumeSilent();
      _pausedByConfirm = false;
    }
  }

  document.getElementById('btn-back-to-menu').addEventListener('click', showConfirm);
  document.getElementById('btn-confirm-yes').addEventListener('click', goToMenu);
  document.getElementById('btn-confirm-no').addEventListener('click', cancelConfirm);

  // ── Confirmação de saída da página ────────────────────────────────────────

  window.addEventListener('beforeunload', (e) => {
    if (!window.game || window.game.gameOver) return;

    // Pausa o(s) jogo(s) antes do diálogo nativo do navegador aparecer
    if (!window.game.isPaused) window.game.togglePause();
    if (window.game2 && !window.game2.isPaused) window.game2.togglePause();

    e.preventDefault();
    e.returnValue = '';
  });

  // ── Settings ──────────────────────────────────────────────────────────────

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
