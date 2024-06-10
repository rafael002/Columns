class Board {
    constructor(xsize, ysize) {
        // Getting the size of received element
        this.analize = false;
        this.xsize = xsize;
        this.ysize = ysize;
        this.resetBoard();
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
     * Remove a received piece in the screen drawing
     */
    removeCurrentPiece(piece){
        for(let i = 0; i < piece.size; i++){
            this.screenMap[piece.y + i][piece.x] = 0;
        }
    }

    /**
     * this method will prepare the matrix of our screen
     */
    resetBoard() {
        // creating the main matrix
        this.screenMap = [];

        // create the second dimension of matrix
        for(let i = 0; i < this.ysize; i++) {
            this.screenMap[i] = [];
        }

        // set the initial values
        for(let i = 0; i < this.ysize; i++) {
            for(let j = 0; j < this.xsize; j++) {
            this.screenMap[i][j] = 0;
            }
        }
    }

    /**
     * Checks the colision with borders and another pieces
     * IF a piece must be destroyed return true
     * directions x = 1 | y = 0
     */             
    checkCollision(isHorizontalMoviment, speed, piece) {
        // Checking borad limit collisions
        if ( !isHorizontalMoviment )
            if( piece.y === 13 && speed === 1 )
                return false;

        if ( piece.x === 0 && speed === -1 )
            return false;

        if ( piece.x === 6 && speed === 1 )
            return false;

        // Checking map collisions
        let x = isHorizontalMoviment ? piece.x + speed : piece.x,
            y = isHorizontalMoviment ? piece.y : piece.y + speed;
        
        if( !isHorizontalMoviment ) // vertical
            if(this.screenMap[y+ piece.size - 1][x] !== 0)
                return false;

        for( let i = 0; i < piece.size; i++ )
            if( this.screenMap[y+i][x] !== 0 )
                return false;

        // remove original piece of position
        this.removeCurrentPiece(piece);
        return true;
    }

  /**
  * Changes the position of piece in the screen
  * return false if another piece is necessary
  */
  control(event, piece) {
    switch(event.keyCode) {
      case 32: // Shuffle
          piece.shuffle();
      break;
      case 37: // Left
        if(this.checkCollision( 1, -1, piece))
          piece.walkLeft();
      break;
      case 39: // Right
        if(this.checkCollision( 1, 1, piece)) 
          piece.walkRight();
      break;
      case 40: // TOOO verify the next piece
        if(this.checkCollision( 0, 1, piece))
          piece.downPiece();
      break;
    }
    return false;
  }

    #isInsideMap(vertical, horizontal) {
        try {
            return ![
                horizontal >= 0, horizontal < this.screenMap[vertical].length,
                vertical >= 0, vertical < this.screenMap.length,
            ].includes(false);
        } catch (error) {
            return false;
        }
    }

    #walk(vertical, horizontal) {
        // movimento em cruz, sem diagonais
        const axies = {
            vertical: [
                {x: 0, y: -1},
                {x: 0, y: 1}
            ],
            horizontal: [
                {x: -1, y: 0},
                {x: 1, y: 0}
            ],
            first_diagonal: [
                {x: -1, y: -1},
                {x: 1, y: 1}
            ],
            second_diagonal: [
                {x: 1, y: -1},
                {x: -1, y: 1}
            ]
        };

        let matches = [];
        if (this.#isInsideMap(vertical, horizontal)) {
            // antes de andar, pegar o valor atual
            const value = this.screenMap[vertical][horizontal];

            if (value != 0) {
                let walkV = 0;
                let walkH = 0;
                
                for (const [key, object] of Object.entries(axies)) {
                    for (const current of object) { // {x: 0, y: -1} exemplo

                    // criando com o bloco inicial
                    let currentMatch = [{x: horizontal, y: vertical}];

                    // setanndo o ponto de partida
                    walkV = vertical;
                    walkH = horizontal;

                    let continuar = true;
                    
                    do {
                        // adicionando a cada iteracao, fará com que a procure caminhe
                        walkH = walkH + current.x;
                        walkV = walkV + current.y;

                        if (this.#isInsideMap(walkV, walkH) &&
                            (value == this.screenMap[walkV][walkH]) &&
                            this.screenMap[walkV][walkH] != 0 &&
                            this.screenMap[walkV][walkH] != 9
                            ) { 
                            currentMatch.push({x: walkH, y: walkV});
                        } else {
                            continuar = false;
                        }
                    } while (continuar);
                        if (currentMatch.length > 2) {
                            matches = matches.concat(currentMatch);
                        }
                        currentMatch = [];
                    }
                }
            } 
        }
        return matches;
    }

    gravity() {
        let updateBoard = true;

        while(updateBoard) {
            updateBoard = false;

            for (let vertical = 0; vertical < this.screenMap.length; vertical++) {
                for (let horizontal = 0; horizontal < this.screenMap[vertical].length; horizontal++) {
                    if(
                        vertical > this.screenMap.length &&
                        this.screenMap[vertical][horizontal] != 0 &&
                        this.screenMap[vertical + 1][horizontal] == 0
                    ) {
                        let updateBoard = true;
                        console.log("preso");
                        this.screenMap[vertical + 1][horizontal] = this.screenMap[vertical][horizontal];
                        this.screenMap[vertical][horizontal] = 0;
                    }
                }
            }
        }
    }

    checkChained() { // TODO melhorar nome
        while(this.match()) {
            this.gravity();
        }
    }


    match() {
        let matches = [];

        for (let vertical = 0; vertical < this.screenMap.length; vertical++) {
            for (let horizontal = 0; horizontal < this.screenMap[vertical].length; horizontal++) {
                let m = this.#walk(vertical, horizontal, this.screenMap);
                if (m.length > 0) {
                    matches.push(m);
                }
            }
        }

        let list = matches.flat();

        if (list.length > 0) {
            console.log(list);
        }

        for (const current of list) {
            this.screenMap[current.y][current.x] = 0;
        }

        return list.length > 0 ? true : false;
    }
}