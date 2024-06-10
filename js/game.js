var piece = new Piece(3),
    element = document.getElementById("p1"),
    board = new Board(6, 16),
    screen = new Screen(element),
    fps = 15,
    level = 3,
    downPiece = fps / level;

    game_loop = function() {
      setTimeout(function() {
          board.addCurrentPiece(piece);
          screen.refresh(board);

          // TODO MOVE THIS PART TO PIECE CLASS
          downPiece--;
          if(downPiece === 0) {
              board.removeCurrentPiece(piece);
              if(board.checkCollision( 0, 1, piece)) {
                  piece.y++;
              }
              downPiece = fps / level;
              if( piece.y === (screen.ysize -3) || !(board.checkCollision( 0, 1, piece))){
                  if(piece.y > 0) {
                      board.addCurrentPiece(piece);
                      board.checkChained();
                      piece.newRocks();
                      piece.x = piece.INITIAL_X_POSITION;
                      piece.y = piece.INITIAL_Y_POSITION;
                  }
                  else{
                    this.alert("game over");
                    return false; // end game TODO remove after all tests
                  }
              }
          }
          //////////////////////////////////////
          
          game_loop();
      }, 1000 / fps);
    };

    // controls listener
    window.addEventListener('keydown', function(event) {
      let resetPiece = board.control(event, piece);
      if(resetPiece){
          if(piece.y > 2){
              board.addCurrentPiece(piece);
              piece.newRocks();
              piece.x = piece.INITIAL_X_POSITION;
              piece.y = piece.INITIAL_Y_POSITION;
          }
      }
    }, false);
//game loop
game_loop();
