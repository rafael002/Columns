var piece = new Piece([1,2,3]),
    element = document.getElementById("p1"),
    screen = new Screen(element),
    search = new Search(6, 13),
    fps = 15,
    game_loop = function(){
      setTimeout(function(){
          // screen.addCurrentPiece(piece);
          // TODO REMOVE AFTER TESTS this generate a patter to tests of search
          search.generatePattern(screen.screenMap);
          search.analyse(screen.screenMap);
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
