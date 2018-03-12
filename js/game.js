var piece = new Piece([1,2,3]),
    element = document.getElementById("p1"),
    screen = new Screen(element),
    fps = 15,
    game_loop = function(){
      setTimeout(function(){
        screen.addCurrentPiece(piece);
        screen.refresh();
        game_loop();
      }, 1000 / fps);
    };

    // controls listener
    window.addEventListener('keydown', function(event) {
      let resetPiece = screen.control(event, piece);
      if(resetPiece){
        screen.addCurrentPiece(piece);
        piece.x = 0;
        piece.y = 0;
      }

    }, false);

//game loop
game_loop();
