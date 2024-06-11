var piece = new Piece(3),
element = document.getElementById("p1"),
board = new Board(6, 16),
screen = new Screen(element),
fps = 5,
level = 1,

function gameLoop() {
    board.addCurrentPiece(piece);
    screen.refresh(board);

    board.removeCurrentPiece(piece);
    if(board.checkCollision(0, 1, piece)) {
        piece.downPiece();
    }

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
        return false;
        }
    }

    window.requestAnimationFrame(gameLoop);
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

window.requestAnimationFrame(gameLoop);
