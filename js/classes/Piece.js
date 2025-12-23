class Piece {
  constructor(numberOfRocks = CONFIG.PIECE_SIZE) {
    this.rocks = [];
    this.INITIAL_X_POSITION = CONFIG.INITIAL_X_POSITION;
    this.INITIAL_Y_POSITION = CONFIG.INITIAL_Y_POSITION;
    this.size = numberOfRocks;
    this.reset();
  }

  reset() {
    this.x = this.INITIAL_X_POSITION;
    this.y = this.INITIAL_Y_POSITION;
    this.newRocks();
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