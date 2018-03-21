var piece = new Piece([1,2,3]),
    element = document.getElementById("p1"),
    screen = new Screen(element, 6, 16),
    search = new Search(screen.INITIAL_X_POSITION, screen.INITIAL_Y_POSITION),
    fps = 60,
    level = 5,
    downPiece = fps / level;
    game_loop = function(){
      setTimeout(function(){
          screen.addCurrentPiece(piece);
          // TODO REMOVE AFTER TESTS this generate a patter to tests of search
          // search.generatePattern(screen.screenMap);
          // search.analyse(screen.screenMap);
          screen.refresh();
          // TODO MOVE THIS PART TO PIECE CLASS
          downPiece--;
          if(downPiece === 0){
              screen.removeCurrentPiece(piece);
              piece.y++;
              downPiece = fps / level;
              if( piece.y === (screen.ysize -3) || !(screen.checkCollision( 0, 1, piece))){
                  if(piece.y > 2){
                      screen.addCurrentPiece(piece);
                      piece.x = piece.INITIAL_X_POSITION;
                      piece.y = piece.INITIAL_Y_POSITION;
                  }
                  else{
                      screen.game_over();
                  }
              }
          }
          //////////////////////////////////////
          game_loop();
      }, 1000 / fps);
    };

    // controls listener
    window.addEventListener('keydown', function(event) {
      let resetPiece = screen.control(event, piece);
      if(resetPiece){
          if(piece.y > 2){
              screen.addCurrentPiece(piece);
              piece.x = piece.INITIAL_X_POSITION;
              piece.y = piece.INITIAL_Y_POSITION;
          }
          else{
              screen.game_over();
          }
      }
    }, false);
//game loop
game_loop();
