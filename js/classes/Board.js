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
     * Line sweep em 4 eixos: horizontal, vertical, diagonal ↘, anti-diagonal ↗
     * @returns {Array} array de {col, row, value} das gemas marcadas, ou [] se nenhum match
     */
    match() {
        const H = this.ysize;
        const W = this.xsize;
        const map = this.screenMap;
        const EMPTY  = CONFIG.EMPTY_CELL;
        const MARKED = CONFIG.MARKED_CELL;
        const MIN    = CONFIG.MIN_MATCH_SIZE;

        const toMark = new Set();

        const scanLine = (coords) => {
            const len = coords.length;
            if (len < MIN) return;
            let runStart = 0;
            for (let i = 1; i <= len; i++) {
                const [pr, pc] = coords[runStart];
                const prevVal  = map[pr][pc];
                let same = false;
                if (i < len) {
                    const [cr, cc] = coords[i];
                    const curVal   = map[cr][cc];
                    same = curVal === prevVal && curVal !== EMPTY && curVal !== MARKED;
                }
                if (!same) {
                    const runLen = i - runStart;
                    if (runLen >= MIN && prevVal !== EMPTY && prevVal !== MARKED) {
                        for (let j = runStart; j < i; j++) {
                            const [r, c] = coords[j];
                            toMark.add(r * W + c);
                        }
                    }
                    runStart = i;
                }
            }
        };

        // Horizontal
        for (let r = 0; r < H; r++) {
            const line = [];
            for (let c = 0; c < W; c++) line.push([r, c]);
            scanLine(line);
        }

        // Vertical
        for (let c = 0; c < W; c++) {
            const line = [];
            for (let r = 0; r < H; r++) line.push([r, c]);
            scanLine(line);
        }

        // Diagonal ↘
        for (let d = -(H - 1); d < W; d++) {
            const r0 = Math.max(0, -d);
            const c0 = Math.max(0, d);
            const line = [];
            for (let r = r0, c = c0; r < H && c < W; r++, c++) line.push([r, c]);
            scanLine(line);
        }

        // Anti-diagonal ↗
        for (let d = 0; d < H + W - 1; d++) {
            const r0 = Math.min(d, H - 1);
            const c0 = d - r0;
            const line = [];
            for (let r = r0, c = c0; r >= 0 && c < W; r--, c++) line.push([r, c]);
            scanLine(line);
        }

        if (toMark.size === 0) return [];

        const markedGems = [];
        for (const encoded of toMark) {
            const r   = Math.floor(encoded / W);
            const c   = encoded % W;
            const val = map[r][c];
            if (val !== EMPTY && val !== MARKED) {
                markedGems.push({ col: c, row: r, value: val });
                map[r][c] = MARKED;
            }
        }
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