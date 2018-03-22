class Piece{
  constructor(numberOfRocks){
    this.rocks = [];
    this.INITIAL_X_POSITION = 3;
    this.INITIAL_Y_POSITION = 0;
    this.x = this.INITIAL_X_POSITION;
    this.y = this.INITIAL_Y_POSITION;
    this.size = numberOfRocks;
    this.newRocks();
  }

  shuffle(){
    let lastRock = this.rocks.pop();
    this.rocks.unshift(lastRock);
  }

  newRocks(){
   for( let i = 0; i < this.size; i++ ){
     this.rocks[i] = Math.floor(Math.random() * 8) + 1 ;
   }
  }
}