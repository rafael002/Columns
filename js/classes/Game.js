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
    if (this.isAnimating) return;

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
   * Finaliza o jogo
   */
  endGame() {
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

