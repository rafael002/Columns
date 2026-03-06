class Game {
  constructor(boardElement) {
    this.board = new Board(CONFIG.BOARD_WIDTH, CONFIG.BOARD_HEIGHT);
    this.piece = new Piece();
    this.screen = new Screen(boardElement);
    this.inputHandler = new InputHandler(this);
    
    this.level = 1;
    this.score = 0;
    this.gameOver = false;
    this.updateInterval = CONFIG.GAME_UPDATE_INTERVAL;
    
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
      // Adiciona a peça atual temporariamente para renderização
      this.board.addCurrentPiece(this.piece);
      this.screen.refresh(this.board, this.piece);
      // Remove a peça após renderização
      this.board.removeCurrentPiece(this.piece);
    } catch (error) {
      console.error('Erro ao renderizar:', error);
    }
  }

  /**
   * Atualiza a lógica do jogo
   */
  update() {
    // Move a peça para baixo
    if (this.board.checkCollision(0, 1, this.piece)) {
      this.piece.downPiece();
    } else {
      // Peça não pode mais descer
      if (this.piece.y > 0) {
        // Adiciona a peça ao tabuleiro permanentemente
        this.board.addCurrentPiece(this.piece);
        
        // Verifica e remove matches
        this.board.checkChained();
        
        // Cria nova peça
        this.piece.reset();
      } else {
        // Game Over
        this.endGame();
      }
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

