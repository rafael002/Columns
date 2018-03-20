class Piece{
  constructor(rocks){
    this.rocks = rocks;
    this.INITIAL_X_POSITION = 3;
    this.INITIAL_Y_POSITION = 0;
    this.x = this.INITIAL_X_POSITION;
    this.y = this.INITIAL_Y_POSITION;
    this.size = this.rocks.length;
  }

  shuffle(){
    let lastRock = this.rocks.pop();
    this.rocks.unshift(lastRock);
  }
}