class Screen{
  constructor(element){
    // Getting the element context
    this.screen = element.getContext('2d');

    // Getting the size of received element
    this.width = element.offsetWidth;
    this.height = element.offsetHeight;

    // Prepare the core matrix
    this.startScreenMatrix();
  }

  /**
  * this method will prepare the matrix of our screen
  */
  startScreenMatrix(){
    // creating the main matrix
    this.screenMap = [];
    // create the second dimension of matrix
    for(let i = 0; i < 13; i++){
      this.screenMap[i] = [];
    }
    // set the initial values
    for(let i = 0; i < 13; i++){
      for(let j = 0; j < 6; j++){
        this.screenMap[i][j] = 0;
      }
    }
  }

  /**
  * Add a received piece in the screen drawing
  */
  addCurrentPiece(piece){
    for(let i = 0; i < piece.size; i++){
      this.screenMap[piece.y + i][piece.x] = piece.rocks[i];
    }
  }

  /**
  * Add a received piece in the screen drawing
  */
  removeCurrentPiece(piece){
    for(let i = 0; i < piece.size; i++){
      this.screenMap[piece.y + i][piece.x] = 0;
    }
  }

  /**
  * Checks the colision with borders and another pieces
  * IF a piece must be destroyed return true
  * directions x = 1 | y = 0
  */
  checkCollision(direction, speed, piece){
    let move = true;
      // check horizontal limits
      if( direction ){
        if( piece.x === 0 && speed === -1 ){
          move = false;
        }
        if( piece.x === 5 && speed === 1 ){
          move = false;
        }
      }
      // check vertical limits
      else{
        if( piece.y === 10 && speed === 1 ){
          move = false;
        }
      }

      if(move){
        // checking map collisions
        let x = direction ? piece.x + speed : piece.x,
            y = direction ? piece.y : piece.y + speed;

        if( direction ){
        // horizontal
        for(let i=0; i < piece.size; i++ ){
            if(this.screenMap[y+i][x] !== 0){
                move = false;
            }
          }
        }
        // vertical
        else{
          if(this.screenMap[y+ piece.size -1][x] !== 0){
              move = false;
          }
        }
      }

      // remove original piece of position
      if ( move ){
        this.removeCurrentPiece(piece); // if must move
      }
      return move;
  }

  /**
  * Changes the position of piece in the screen
  * return false if another piece is necessary
  */
  control(event, piece){
    switch(event.keyCode){
      case 32: // Shuffle
          piece.shuffle();
      break;
      case 37: // Left
        if(this.checkCollision( 1, -1, piece)){
          piece.x--;
        }
      break;
      case 39: // Right
        if(this.checkCollision( 1, 1, piece)){
          piece.x++;
        }
      break;
      case 40: // TOOO verify the next piece
        if(this.checkCollision( 0, 1, piece)){
          piece.y++;
          return false;
        }
        return true;
      break;
    }
    return false;
  }

  /**
  * Redraw a screen
  */
  refresh(){
    // cleaning the canvas and buffer
    this.screen.clearRect(0, 0, this.width, this.heigth);
    // TODO remove after fix clearRect

    for(let i = 0; i < 6; i++){
      for(let j = 0; j < 13; j++){
        // color selection
        switch(this.screenMap[j][i]){
          // red
          case 0:
            this.screen.fillStyle="#FFFFFF";
          break;
          case 1:
            this.screen.fillStyle="#FF0000";
          break;
          // green
          case 2:
            this.screen.fillStyle="#00FF00";
          break;
          // blue
          case 3:
            this.screen.fillStyle="#0000FF";
          break;

          case 9:
            this.screen.fillStyle="#000000";
          break;
        }
        // draw blocks
        this.screen.beginPath();
        // if(this.screenMap[j][i] !== 0){
          this.screen.fillRect(i * 41.6 + 1, j * 41.6 + 1, 40.6, 40.6);
        // }
        // draw grid
        this.screen.strokeRect(i * 41.6, j * 41.6, 41.6, 41.6);
        this.screen.closePath();
      }
    }
  }
}
