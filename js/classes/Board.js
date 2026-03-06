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
            const row = piece.y + i;
            // Verifica se está dentro dos limites do tabuleiro
            if (row >= 0 && row < this.ysize && piece.x >= 0 && piece.x < this.xsize) {
                this.screenMap[row][piece.x] = piece.rocks[i];
            }
        }
    }

    /**
     * Remove a received piece in the screen drawing
     */
    removeCurrentPiece(piece){
        for(let i = 0; i < piece.size; i++){
            const row = piece.y + i;
            // Verifica se está dentro dos limites do tabuleiro
            if (row >= 0 && row < this.ysize && piece.x >= 0 && piece.x < this.xsize) {
                this.screenMap[row][piece.x] = CONFIG.EMPTY_CELL;
            }
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
            this.screenMap[i][j] = CONFIG.EMPTY_CELL;
            }
        }
    }

    /**
     * Checks the colision with borders and another pieces
     * IF a piece must be destroyed return true
     * directions x = 1 | y = 0
     */             
    checkCollision(isHorizontalMoviment, speed, piece) {
        // Calcula a nova posição
        let x = isHorizontalMoviment ? piece.x + speed : piece.x;
        let y = isHorizontalMoviment ? piece.y : piece.y + speed;

        // Verifica limites do tabuleiro
        if (x < 0 || x >= this.xsize) {
            return false;
        }

        if (y < 0 || y + piece.size > this.ysize) {
            return false;
        }

        // Verifica colisões com outras peças
        for (let i = 0; i < piece.size; i++) {
            const checkY = y + i;
            if (checkY >= 0 && checkY < this.ysize) {
                if (this.screenMap[checkY][x] !== CONFIG.EMPTY_CELL) {
                    return false;
                }
            }
        }

        // Remove a peça da posição original antes de mover
        this.removeCurrentPiece(piece);
        return true;
    }

    /**
     * Verifica se a posição está dentro do mapa
     * Baseado no algoritmo Match otimizado
     */
    #isInsideMap(vertical, horizontal) {
        try {
            return horizontal >= 0 && 
                   horizontal < this.screenMap[vertical].length &&
                   vertical >= 0 && 
                   vertical < this.screenMap.length;
        } catch (error) {
            return false;
        }
    }

    /**
     * Procura matches em todas as direções a partir de uma posição
     * Algoritmo otimizado baseado no Match class, com diagonais incluídas
     * 
     * Movimentos:
     *      -1 | 0 | 1           0 | 0 | 0  
     *      _________            _________
     * X -> -1 | 0 | 1     Y -> -1 | 0 | 1
     *      _________            _________
     *      -1 | 0 | 1          -1 | 0 | 1
     */
    #walk(vertical, horizontal) {
        // Direções: vertical, horizontal e diagonais
        const axies = {
            vertical: [
                {x: 0, y: -1},  // cima
                {x: 0, y: 1}    // baixo
            ],
            horizontal: [
                {x: -1, y: 0},  // esquerda
                {x: 1, y: 0}    // direita
            ],
            first_diagonal: [
                {x: -1, y: -1}, // diagonal esquerda-cima
                {x: 1, y: 1}    // diagonal direita-baixo
            ],
            second_diagonal: [
                {x: 1, y: -1},  // diagonal direita-cima
                {x: -1, y: 1}   // diagonal esquerda-baixo
            ]
        };

        let matches = [];
        
        if (!this.#isInsideMap(vertical, horizontal)) {
            return matches;
        }

        // Antes de andar, pegar o valor atual
        const value = this.screenMap[vertical][horizontal];

        if (value === CONFIG.EMPTY_CELL || value === CONFIG.MARKED_CELL) {
            return matches;
        }

        // Procura matches em cada direção
        for (const [key, directions] of Object.entries(axies)) {
            for (const direction of directions) {
                // Criando com o bloco inicial
                let currentMatch = [{x: horizontal, y: vertical}];

                // Setando o ponto de partida
                let walkH = horizontal;
                let walkV = vertical;

                // Caminha na direção até encontrar um valor diferente
                while (true) {
                    walkH += direction.x;
                    walkV += direction.y;

                    if (this.#isInsideMap(walkV, walkH) &&
                        this.screenMap[walkV][walkH] === value &&
                        this.screenMap[walkV][walkH] !== CONFIG.EMPTY_CELL &&
                        this.screenMap[walkV][walkH] !== CONFIG.MARKED_CELL) {
                        currentMatch.push({x: walkH, y: walkV});
                    } else {
                        break;
                    }
                }

                // Se encontrou match válido (3 ou mais), adiciona à lista
                if (currentMatch.length >= CONFIG.MIN_MATCH_SIZE) {
                    matches = matches.concat(currentMatch);
                }
            }
        }

        return matches;
    }

    /**
     * Aplica gravidade - faz as peças caírem
     * Otimizado: percorre de baixo para cima (mais eficiente)
     */
    gravity() {
        let hasChanged = true;

        while(hasChanged) {
            hasChanged = false;

            // Percorre de baixo para cima (mais eficiente)
            for (let vertical = this.ysize - 2; vertical >= 0; vertical--) {
                for (let horizontal = 0; horizontal < this.xsize; horizontal++) {
                    if (this.screenMap[vertical][horizontal] !== CONFIG.EMPTY_CELL &&
                        this.screenMap[vertical + 1][horizontal] === CONFIG.EMPTY_CELL) {
                        this.screenMap[vertical + 1][horizontal] = this.screenMap[vertical][horizontal];
                        this.screenMap[vertical][horizontal] = CONFIG.EMPTY_CELL;
                        hasChanged = true;
                    }
                }
            }
        }
    }

    /**
     * Procura matches e marca células com MARKED_CELL
     * @returns {Array} array de {col, row, value} das gemas marcadas, ou [] se nenhum match
     */
    match() {
        let allMatches = [];

        for (let vertical = 0; vertical < this.screenMap.length; vertical++) {
            for (let horizontal = 0; horizontal < this.screenMap[vertical].length; horizontal++) {
                const matches = this.#walk(vertical, horizontal);
                if (matches.length > 0) {
                    allMatches.push(...matches);
                }
            }
        }

        const uniqueMatches = Array.from(
            new Set(allMatches.map(m => `${m.x},${m.y}`))
        ).map(str => {
            const [x, y] = str.split(',').map(Number);
            return {x, y};
        });

        if (uniqueMatches.length === 0) return [];

        const markedGems = [];
        uniqueMatches.forEach(({ x, y }) => {
            const val = this.screenMap[y][x];
            if (val !== CONFIG.EMPTY_CELL && val !== CONFIG.MARKED_CELL) {
                markedGems.push({ col: x, row: y, value: val });
                this.screenMap[y][x] = CONFIG.MARKED_CELL;
            }
        });
        return markedGems;
    }

    /**
     * Remove células marcadas com MARKED_CELL, substituindo por EMPTY_CELL
     */
    removeMarkedCells() {
        for (let row = 0; row < this.ysize; row++)
            for (let col = 0; col < this.xsize; col++)
                if (this.screenMap[row][col] === CONFIG.MARKED_CELL)
                    this.screenMap[row][col] = CONFIG.EMPTY_CELL;
    }
}