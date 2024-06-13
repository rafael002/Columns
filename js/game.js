;(function () {
    var piece = new Piece(3),
        element = document.getElementById("p1"),
        board = new Board(6, 16),
        screen = new Screen(element),
        fps = 5,
        level = 1,
        gameOver = false;

    // screen updates
    window.requestAnimationFrame(screenUpdate);

    function screenUpdate() {
        board.addCurrentPiece(piece);
        screen.refresh(board);
        board.removeCurrentPiece(piece);
        window.requestAnimationFrame(screenUpdate);
    };

    // game update
    window.setInterval(gameUpdate, 500);

    function gameUpdate() {
      if (gameOver != true) {
        if (board.checkCollision(0, 1, piece))
          piece.downPiece();
  
        if (piece.y === (screen.ysize -3) || !(board.checkCollision( 0, 1, piece))) {
            if(piece.y > 0) {
                board.addCurrentPiece(piece);
                board.checkChained();
                piece.reset();
            }
            else {
                this.alert("game over");
                gameOver = true;
                return false;
            }
        }
      }
    }

     // controls listener
     window.addEventListener('keydown', function(event) {
        if (board.control(event, piece)) {
            board.addCurrentPiece(piece);
            piece.reset();   
        }
    }, false);
})();
