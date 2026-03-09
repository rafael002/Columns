class Game {
  constructor(boardElement, options = {}) {
    this.boardElement = boardElement;
    this.board = new Board(CONFIG.BOARD_WIDTH, CONFIG.BOARD_HEIGHT);
    this.piece = new Piece();
    this.nextPiece = new Piece();
    this.screen = new Screen(boardElement);

    this._ids = {
      score:       options.scoreId       ?? 'score',
      gems:        options.gemsId        ?? 'gems',
      level:       options.levelId       ?? 'level',
      nextPreview: options.nextPreviewId ?? 'next-piece-preview',
      gameOver:    options.gameOverId    ?? 'game-over',
      finalScore:  options.finalScoreId  ?? 'final-score',
      retryBtn:    options.retryBtnId    ?? 'retry-btn',
      title:       options.titleId       ?? 'modal-title',
    };

    this._label = options.label ?? null;

    this.peer = null;
    this.isWinner = false;
    this.isDraw = false;
    this._lostAt = null;

    this.screen.initPreview(document.getElementById(this._ids.nextPreview));

    this.customKeys = options.keys ?? null;
    if (this.customKeys) {
      window.addEventListener('keydown', e => this._handleCustomKey(e));
    } else {
      this.inputHandler = new InputHandler(this);
    }

    this.level = 1;
    this.score = 0;
    this.gems = 0;
    this.gameOver = false;
    this.updateInterval = CONFIG.GAME_UPDATE_INTERVAL;

    this.isAnimating = false;
    this.isGameOverAnimating = false;
    this._gameOverRow = -1;
    this._gameOverRowsDone = false;
    this.explosionEffect = null;
    this.previewExplosion = null;
    this._updateLoopId = null;
    this._renderStarted = false;
    this._duringCountdown = true;
    this._countdownGen = 0;
    this.isPaused = false;
    this._pausedDuringCountdown = false;
    this._countdownDuration = options.countdownDuration ?? 3700;
    this._onCountdownStart = options.onCountdownStart ?? null;
    this._onGameStart = options.onGameStart ?? null;
    this._onGameOver = options.onGameOver ?? null;
    this._onShuffle = options.onShuffle ?? null;
    this._onDrop = options.onDrop ?? null;
    this._onMatch = options.onMatch ?? null;
    this._onLevelUp = options.onLevelUp ?? null;
    this._onPause = options.onPause ?? null;
    this._onResume = options.onResume ?? null;

    fetch('js/config/resources.json')
      .then(r => r.json())
      .then(cfg => {
        this.explosionEffect = new ExplosionEffect(boardElement, cfg.sprites.explosion);
        this.previewExplosion = new ExplosionEffect(
          document.getElementById(this._ids.nextPreview),
          cfg.sprites.explosion
        );
        if (!this._duringCountdown) {
          this.screen.refreshPreview(this.nextPiece);
        }
      });

    document.getElementById(this._ids.retryBtn)?.addEventListener('click', () => {
      this.reset();
      this.peer?.reset();
    });
    document.addEventListener('keydown', e => {
      if (this.gameOver && e.key === 'Enter') { this.reset(); this.peer?.reset(); }
      if (e.key === 'Escape') this.togglePause();
    });

    this._startCountdown();
  }

  _startCountdown() {
    this.screen.clearPreview();
    const gen = ++this._countdownGen;
    this._onCountdownStart?.();

    const overlay = document.createElement('div');
    overlay.className = 'countdown-overlay';
    const text = document.createElement('span');
    text.className = 'countdown-text';
    overlay.appendChild(text);
    this.boardElement.parentElement.appendChild(overlay);

    this.startGameLoop();

    const tickMs = Math.floor(this._countdownDuration / 4);
    let count = 3;
    text.textContent = count;

    const tick = () => {
      if (gen !== this._countdownGen) { overlay.remove(); return; }
      count--;
      if (count > 0) {
        text.textContent = count;
        setTimeout(tick, tickMs);
      } else {
        text.textContent = 'GO!';
        setTimeout(() => {
          if (gen !== this._countdownGen) { overlay.remove(); return; }
          this._duringCountdown = false;
          overlay.remove();
          this.screen.refreshPreview(this.nextPiece);
          this.startUpdateLoop();
          this._onGameStart?.();
        }, tickMs);
      }
    };
    setTimeout(tick, tickMs);
  }

  _handleCustomKey(e) {
    if (this.isGameOver()) return;
    const piece = this.piece;
    const board = this.board;
    const k = this.customKeys;
    switch (e.keyCode) {
      case k.SHUFFLE: piece.shuffle(); this._onShuffle?.(); e.preventDefault(); break;
      case k.LEFT:  if (board.checkCollision(1, -1, piece)) piece.walkLeft();  e.preventDefault(); break;
      case k.RIGHT: if (board.checkCollision(1,  1, piece)) piece.walkRight(); e.preventDefault(); break;
      case k.DOWN:  if (board.checkCollision(0,  1, piece)) piece.downPiece(); e.preventDefault(); break;
    }
  }

  /**
   * Loop de renderização (60 FPS)
   */
  startGameLoop() {
    if (this._renderStarted) return;
    this._renderStarted = true;
    const render = () => {
      if (!this.gameOver) {
        this.render();
      }
      window.requestAnimationFrame(render);
    };
    render();
  }

  /**
   * Loop de atualização do jogo (lógica)
   */
  startUpdateLoop() {
    this._updateLoopId = setInterval(() => {
      if (!this.gameOver) {
        this.update();
      }
    }, this.updateInterval);
  }

  /**
   * Renderiza o jogo
   */
  render() {
    try {
      if (this.isGameOverAnimating && this.explosionEffect) {
        this.explosionEffect.update();
        if (this.previewExplosion) this.previewExplosion.update();

        if (this._gameOverRowsDone && this.explosionEffect.isDone()) {
          this._finishGameOver();
        }

        this.screen.refresh(this.board, null);
        return;
      }

      if (this.isAnimating && this.explosionEffect) {
        this.explosionEffect.update();

        if (this.explosionEffect.isDone()) {
          this.board.removeMarkedCells();
          this.board.gravity();
          const marked = this.board.match();
          if (marked.length > 0) {
            this._addGems(marked.length);
            this.explosionEffect.addEffects(marked);
          } else {
            this.isAnimating = false;
            this._swapPiece();
          }
        }

        this.screen.refresh(this.board, null);
        this.screen.refreshPreview(this.nextPiece);
        return;
      }

      if (this._duringCountdown) {
        this.screen.refresh(this.board, null);
      } else {
        this.board.addCurrentPiece(this.piece);
        this.screen.refresh(this.board, this.piece);
        this.board.removeCurrentPiece(this.piece);
        this.screen.refreshPreview(this.nextPiece);
      }
    } catch (error) {
      console.error('Erro ao renderizar:', error);
    }
  }

  /**
   * Atualiza a lógica do jogo
   */
  update() {
    if (this.isAnimating || this.isGameOverAnimating) return;

    if (this.board.checkCollision(0, 1, this.piece)) {
      this.piece.downPiece();
    } else {
      if (this.piece.y > 0) {
        this._onDrop?.();
        this.board.addCurrentPiece(this.piece);
        this._resolveChain();
      } else {
        this.endGame();
      }
    }
  }

  /**
   * Inicia a resolução de matches (com animação se disponível)
   */
  _resolveChain() {
    const marked = this.board.match();
    if (marked.length > 0 && this.explosionEffect) {
      this._addGems(marked.length);
      this.explosionEffect.addEffects(marked);
      this.isAnimating = true;
    } else {
      this.board.removeMarkedCells();
      this.board.gravity();
      this._swapPiece();
    }
  }

  _addGems(count) {
    this.gems += count;
    this._onMatch?.();
    document.getElementById(this._ids.gems).textContent = this.gems;

    const newLevel = Math.floor(this.gems / 15) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      document.getElementById(this._ids.level).textContent = this.level;
      this.updateInterval = Math.max(100, CONFIG.GAME_UPDATE_INTERVAL - (this.level - 1) * 40);
      if (this._updateLoopId) {
        clearInterval(this._updateLoopId);
        this.startUpdateLoop();
      }
      this._onLevelUp?.();
    }
  }

  _swapPiece() {
    this.piece = this.nextPiece;
    this.piece.x = this.piece.INITIAL_X_POSITION;
    this.piece.y = this.piece.INITIAL_Y_POSITION;
    this.nextPiece = new Piece();
  }

  setPeer(game) {
    this.peer = game;
  }

  winGame() {
    // Empate: o jogo "vencedor" também perderia (peça presa no topo)
    const alsoLost = this.piece.y <= 0 && !this.board.checkCollision(0, 1, this.piece);
    if (alsoLost && this.peer && this.peer._lostAt) {
      this.isDraw = true;
      this.peer.isDraw = true;
      this.peer.isWinner = false;
    } else {
      this.isWinner = true;
    }
    this.endGame(true);
  }

  /**
   * Inicia a animação de game over (varredura de baixo para cima)
   */
  endGame(fromWin = false) {
    if (this.isGameOverAnimating || this.gameOver) return;
    this.isGameOverAnimating = true;

    if (!fromWin) {
      this._lostAt = Date.now();
      if (this.peer && !this.peer.isGameOverAnimating && !this.peer.gameOver) {
        this.peer.winGame();
      }
    }

    if (!this.explosionEffect) {
      this._finishGameOver();
      return;
    }
    this._gameOverRowsDone = false;
    this._gameOverRow = CONFIG.BOARD_HEIGHT - 1;

    if (this.previewExplosion) {
      this.screen.clearPreview();
      const gems = this.nextPiece.rocks.map((val, i) => ({
        col: 0, row: i + CONFIG.VISUAL_OFFSET, value: val
      }));
      this.previewExplosion.addEffects(gems);
    }

    this._scheduleGameOverRow();
  }

  /**
   * Dispara a explosão da linha atual e agenda a próxima com 50ms de intervalo
   */
  _scheduleGameOverRow() {
    if (this._gameOverRow < 0) {
      this._gameOverRowsDone = true;
      return;
    }
    const gems = [];
    for (let col = 0; col < CONFIG.BOARD_WIDTH; col++) {
      const val = this.board.screenMap[this._gameOverRow][col];
      if (val !== CONFIG.MARKED_CELL) {
        gems.push({ col, row: this._gameOverRow, value: val });
        this.board.screenMap[this._gameOverRow][col] = CONFIG.MARKED_CELL;
      }
    }
    this.explosionEffect.addEffects(gems);
    this._gameOverRow--;
    setTimeout(() => this._scheduleGameOverRow(), 50);
  }

  /**
   * Conclui o game over após a animação
   */
  _finishGameOver() {
    this.isGameOverAnimating = false;
    this.gameOver = true;

    // Em 1x1, só o vencedor (ou empate) exibe o overlay
    if (this.peer && !this.isWinner && !this.isDraw) return;

    const overlay = document.getElementById(this._ids.gameOver);
    if (!overlay) return;

    const titleEl = document.getElementById(this._ids.title);
    if (titleEl) {
      if (this.isDraw) {
        titleEl.textContent = 'DRAW!';
      } else if (this.isWinner) {
        titleEl.textContent = this._label ? `${this._label} WON!` : 'YOU WON!';
      } else {
        titleEl.textContent = 'GAME OVER';
      }
    }

    const scoreSpan = document.getElementById(this._ids.finalScore);
    if (scoreSpan) {
      const line = scoreSpan.closest('.game-over-score-line');
      if (line && this.peer) {
        const myLabel   = this._label        ?? 'P1';
        const peerLabel = this.peer._label   ?? 'P2';
        line.textContent = `${myLabel}: ${this.score}   ${peerLabel}: ${this.peer.score}`;
      } else if (line) {
        line.textContent = `Score: ${this.score}`;
      }
    }

    this._onGameOver?.();
    overlay.classList.add('visible');
  }

  _interruptCountdown() {
    if (!this._duringCountdown) return;
    this._countdownGen++;
    this.boardElement.parentElement.querySelector('.countdown-overlay')?.remove();
  }

  pauseSilent() {
    if (this.gameOver || this.isGameOverAnimating || this.isPaused) return;
    this.isPaused = true;
    if (this._duringCountdown) {
      this._pausedDuringCountdown = true;
      this._interruptCountdown();
    } else {
      this._pausedDuringCountdown = false;
      clearInterval(this._updateLoopId);
      this._updateLoopId = null;
    }
  }

  resumeSilent() {
    if (!this.isPaused) return;
    this.isPaused = false;
    if (this._pausedDuringCountdown) {
      this._pausedDuringCountdown = false;
      this._startCountdown();
    } else {
      this.startUpdateLoop();
    }
  }

  togglePause() {
    if (this.gameOver || this.isGameOverAnimating || this._duringCountdown) return;
    const overlay = document.getElementById(this._ids.gameOver);
    if (overlay?.classList.contains('confirming')) return;

    if (!this.isPaused) {
      this.isPaused = true;
      if (this._duringCountdown) {
        this._pausedDuringCountdown = true;
        this._interruptCountdown();
      } else {
        this._pausedDuringCountdown = false;
        clearInterval(this._updateLoopId);
        this._updateLoopId = null;
      }
      this._onPause?.();
      if (overlay) {
        document.getElementById(this._ids.title).textContent = 'PAUSE!';
        overlay.classList.add('visible', 'paused');
      }
    } else {
      this.isPaused = false;
      if (overlay) overlay.classList.remove('visible', 'paused');
      if (this._pausedDuringCountdown) {
        this._pausedDuringCountdown = false;
        this._startCountdown();
      } else {
        this.startUpdateLoop();
      }
      this._onResume?.();
    }
  }

  isGameOver() {
    return this.gameOver;
  }

  getCurrentPiece() {
    return this.piece;
  }

  getBoard() {
    return this.board;
  }

  /**
   * Reinicia o jogo
   */
  reset() {
    clearInterval(this._updateLoopId);
    this._updateLoopId = null;

    this.board.resetBoard();
    this.piece = new Piece();
    this.nextPiece = new Piece();
    this.level = 1;
    this.score = 0;
    this.gems = 0;
    this.gameOver = false;
    this.isAnimating = false;
    this.isGameOverAnimating = false;
    this._gameOverRowsDone = false;
    this.isWinner = false;
    this.isDraw = false;
    this._lostAt = null;
    this._duringCountdown = true;
    this.isPaused = false;
    this._pausedDuringCountdown = false;

    document.getElementById(this._ids.gameOver)?.classList.remove('visible', 'paused');
    document.getElementById(this._ids.score).textContent = 0;
    document.getElementById(this._ids.gems).textContent = 0;
    this._startCountdown();
  }
}
