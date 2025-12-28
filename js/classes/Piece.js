class Piece {
  constructor(numberOfRocks = CONFIG.PIECE_SIZE) {
    this.rocks = [];
    this.INITIAL_X_POSITION = CONFIG.INITIAL_X_POSITION;
    this.INITIAL_Y_POSITION = CONFIG.INITIAL_Y_POSITION;
    this.size = numberOfRocks;
    
    // Posição lógica (inteira, para lógica do jogo)
    this.x = this.INITIAL_X_POSITION;
    this.y = this.INITIAL_Y_POSITION;
    
    // Posição visual (float, para animação suave)
    this.visualX = this.INITIAL_X_POSITION;
    this.visualY = this.INITIAL_Y_POSITION;
    
    this.reset();
  }

  reset() {
    this.x = this.INITIAL_X_POSITION;
    this.y = this.INITIAL_Y_POSITION;
    this.visualX = this.INITIAL_X_POSITION;
    this.visualY = this.INITIAL_Y_POSITION;
    this.newRocks();
  }

  /**
   * Reseta apenas a posição sem gerar novas gemas
   * Útil quando a peça já tem gemas definidas (ex: troca de peça atual pela próxima)
   */
  resetPosition() {
    this.x = this.INITIAL_X_POSITION;
    this.y = this.INITIAL_Y_POSITION;
    this.visualX = this.INITIAL_X_POSITION;
    this.visualY = this.INITIAL_Y_POSITION;
  }
  
  /**
   * Atualiza a posição visual interpolando em direção à posição lógica
   * Deve ser chamado a cada frame de renderização para animação suave
   */
  updateVisualPosition() {
    const interpolated = interpolate2D(
      {x: this.visualX, y: this.visualY},
      {x: this.x, y: this.y}
    );
    this.visualX = interpolated.x;
    this.visualY = interpolated.y;
  }

  walkLeft() {
    this.x -= 1;
  }

  walkRight() {
    this.x += 1;
  }

  downPiece() {
    this.y += 1;
  }

  shuffle() {
    if (this.rocks.length > 1) {
      const lastRock = this.rocks.pop();
    this.rocks.unshift(lastRock);
  }
  }

  newRocks() {
    for (let i = 0; i < this.size; i++) {
      this.rocks[i] = getRandomColor();
   }
  }
}