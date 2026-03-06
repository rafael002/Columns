class Game {
  constructor(boardElement) {
    this.boardElement = boardElement;
    this.board = new Board(CONFIG.BOARD_WIDTH, CONFIG.BOARD_HEIGHT);
    this.piece = new Piece();
    this.screen = new Screen(boardElement);
    this.inputHandler = new InputHandler(this);

    this.level = 1;
    this.score = 0;
    this.gameOver = false;
    this.updateInterval = CONFIG.GAME_UPDATE_INTERVAL;

    this.isAnimating = false;
    this.isGameOverAnimating = false;
    this._gameOverRow = -1;
    this.explosionEffect = null;

    fetch('js/config/resources.json')
      .then(r => r.json())
      .then(cfg => {
        this.explosionEffect = new ExplosionEffect(boardElement, cfg.sprites.explosion);
      });

    this.startGameLoop();
    this.startUpdateLoop();
  }

  /**
   * Loop de renderização (60 FPS)
   */
  startGameLoop() {
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
    setInterval(() => {
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

        if (this.explosionEffect.isDone()) {
          this.board.removeMarkedCells();
          this._gameOverRow--;
          this._triggerGameOverRow();
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
            this.explosionEffect.addEffects(marked);
          } else {
            this.isAnimating = false;
            this.piece.reset();
          }
        }
      }

      this.board.addCurrentPiece(this.piece);
      this.screen.refresh(this.board, this.piece);
      this.board.removeCurrentPiece(this.piece);
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
      this.explosionEffect.addEffects(marked);
      this.isAnimating = true;
    } else {
      this.board.removeMarkedCells();
      this.board.gravity();
      this.piece.reset();
    }
  }

  /**
   * Inicia a animação de game over (varredura de baixo para cima)
   */
  endGame() {
    if (!this.explosionEffect) {
      this._finishGameOver();
      return;
    }
    this.isGameOverAnimating = true;
    this._gameOverRow = CONFIG.BOARD_HEIGHT - 1;
    this._triggerGameOverRow();
  }

  /**
   * Explode todas as gemas da linha atual e avança para a linha acima
   */
  _triggerGameOverRow() {
    while (this._gameOverRow >= 0) {
      const gems = [];
      for (let col = 0; col < CONFIG.BOARD_WIDTH; col++) {
        const val = this.board.screenMap[this._gameOverRow][col];
        if (val !== CONFIG.EMPTY_CELL && val !== CONFIG.MARKED_CELL) {
          gems.push({ col, row: this._gameOverRow, value: val });
          this.board.screenMap[this._gameOverRow][col] = CONFIG.MARKED_CELL;
        }
      }
      if (gems.length > 0) {
        this.explosionEffect.addEffects(gems);
        return; // aguarda a animação desta linha
      }
      this._gameOverRow--;
    }
    this._finishGameOver();
  }

  /**
   * Conclui o game over após a animação
   */
  _finishGameOver() {
    this.isGameOverAnimating = false;
    this.gameOver = true;
    const overlay = document.getElementById('game-over');
    if (overlay) {
      document.getElementById('final-score').textContent = this.score;
      overlay.classList.add('visible');
    }
  }

  /**
   * Verifica se o jogo acabou
   */
  isGameOver() {
    return this.gameOver;
  }

  /**
   * Retorna a peça atual (para InputHandler)
   */
  getCurrentPiece() {
    return this.piece;
  }

  /**
   * Retorna o tabuleiro (para InputHandler)
   */
  getBoard() {
    return this.board;
  }

  /**
   * Reinicia o jogo
   */
  reset() {
    this.board.resetBoard();
    this.piece.reset();
    this.level = 1;
    this.score = 0;
    this.gameOver = false;
  }
}

