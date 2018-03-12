class Piece{
  constructor(rocks){
    this.rocks = rocks;
    this.x = 0;
    this.y = 0;
    this.size = this.rocks.length;
  }

  shuffle(){
    let lastRock = this.rocks.pop();
    this.rocks.unshift(lastRock);
  }
}