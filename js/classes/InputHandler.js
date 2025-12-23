class InputHandler {
  constructor(game) {
    this.game = game;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('keydown', (event) => {
      this.handleKeyPress(event);
    }, false);
  }

  handleKeyPress(event) {
    if (this.game.isGameOver()) return;

    const piece = this.game.getCurrentPiece();
    const board = this.game.getBoard();

    switch (event.keyCode) {
      case CONFIG.KEYS.SPACE:
        piece.shuffle();
        event.preventDefault();
        break;

      case CONFIG.KEYS.LEFT:
        if (board.checkCollision(1, -1, piece)) {
          piece.walkLeft();
        }
        event.preventDefault();
        break;

      case CONFIG.KEYS.RIGHT:
        if (board.checkCollision(1, 1, piece)) {
          piece.walkRight();
        }
        event.preventDefault();
        break;

      case CONFIG.KEYS.DOWN:
        if (board.checkCollision(0, 1, piece)) {
          piece.downPiece();
        }
        event.preventDefault();
        break;
    }
  }
}

