class Board {
    constructor(xsize, ysize) {
        // Getting the size of received element
        this.analize = false;
        this.xsize = xsize;
        this.ysize = ysize;
        this.markedGems = []; // Array de gemas marcadas para quebra (com informações de cor/valor)
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
                // Inicializa posição visual igual à lógica quando a peça é adicionada
                this.visualMap[row][piece.x] = row;
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
        
        // Mapa visual para interpolação (armazena posição Y visual de cada célula)
        this.visualMap = [];

        // create the second dimension of matrix
        for(let i = 0; i < this.ysize; i++) {
            this.screenMap[i] = [];
            this.visualMap[i] = [];
        }

        // set the initial values
        for(let i = 0; i < this.ysize; i++) {
            for(let j = 0; j < this.xsize; j++) {
                this.screenMap[i][j] = CONFIG.EMPTY_CELL;
                this.visualMap[i][j] = i; // Posição visual inicial = posição lógica
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
     * 
     * IMPORTANTE: Combina as direções opostas de cada eixo para detectar matches completos
     */
    #walk(vertical, horizontal) {
        // Direções: vertical, horizontal e diagonais
        // Cada eixo tem duas direções opostas que devem ser combinadas
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

        const value = this.screenMap[vertical][horizontal];

        if (value === CONFIG.EMPTY_CELL || value === CONFIG.MARKED_CELL) {
            return matches;
        }

        // Procura matches em cada eixo (combinando as duas direções opostas)
        for (const [key, directions] of Object.entries(axies)) {
            // Cria um match combinando ambas as direções do eixo
            // Começa com a célula inicial
            let currentMatch = [{x: horizontal, y: vertical}];

            // Caminha em ambas as direções do eixo e combina os resultados
            for (const direction of directions) {
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
            }

            // Se encontrou match válido (3 ou mais), adiciona à lista
            if (currentMatch.length >= CONFIG.MIN_MATCH_SIZE) {
                matches = matches.concat(currentMatch);
            }
        }

        return matches;
    }

    /**
     * Aplica gravidade - faz as peças caírem
     * Otimizado: percorre de baixo para cima (mais eficiente)
     * Atualiza também o visualMap para interpolação suave
     */
    gravity() {
        let hasChanged = true;

        // Salva as posições visuais ANTES de aplicar gravidade
        // Isso garante que células que caem múltiplas posições mantenham sua posição visual original
        const snapshotVisualMap = [];
        for (let row = 0; row < this.ysize; row++) {
            snapshotVisualMap[row] = [];
            for (let col = 0; col < this.xsize; col++) {
                snapshotVisualMap[row][col] = this.visualMap[row][col];
            }
        }

        while(hasChanged) {
            hasChanged = false;

            // Percorre de baixo para cima (mais eficiente)
            for (let vertical = this.ysize - 2; vertical >= 0; vertical--) {
                for (let horizontal = 0; horizontal < this.xsize; horizontal++) {
                    if (this.screenMap[vertical][horizontal] !== CONFIG.EMPTY_CELL &&
                        this.screenMap[vertical + 1][horizontal] === CONFIG.EMPTY_CELL) {
                        // Move a célula logicamente
                        this.screenMap[vertical + 1][horizontal] = this.screenMap[vertical][horizontal];
                        this.screenMap[vertical][horizontal] = CONFIG.EMPTY_CELL;
                        
                        // Atualiza posição visual para interpolação suave
                        // Usa a posição visual do SNAPSHOT (antes da gravidade) para garantir animação suave
                        // Se a célula de destino já tinha uma posição visual diferente, mantém a mais antiga
                        const snapshotVisualY = snapshotVisualMap[vertical][horizontal];
                        const currentDestVisualY = this.visualMap[vertical + 1][horizontal];
                        
                        // Se a célula de destino estava vazia (visualY == posição lógica), usa o snapshot
                        // Caso contrário, mantém a posição visual mais antiga (menor valor)
                        if (Math.abs(currentDestVisualY - (vertical + 1)) < 0.01) {
                            // Célula de destino estava vazia, usa a posição visual do snapshot
                            this.visualMap[vertical + 1][horizontal] = snapshotVisualY;
                        } else {
                            // Célula de destino já tinha uma posição visual (pode estar caindo também)
                            // Mantém a posição visual mais antiga (menor valor) para animação suave
                            this.visualMap[vertical + 1][horizontal] = Math.min(snapshotVisualY, currentDestVisualY);
                        }
                        
                        // Célula vazia volta à posição lógica
                        this.visualMap[vertical][horizontal] = vertical;
                        
                        hasChanged = true;
                    }
                }
            }
        }
    }

    /**
     * Atualiza as posições visuais de todas as células do tabuleiro
     * Interpola suavemente em direção às posições lógicas
     * Deve ser chamado a cada frame de renderização
     */
    updateVisualPositions() {
        for (let row = 0; row < this.ysize; row++) {
            for (let col = 0; col < this.xsize; col++) {
                // Interpola a posição visual Y em direção à posição lógica (row)
                this.visualMap[row][col] = interpolate(this.visualMap[row][col], row);
            }
        }
    }

    /**
     * Verifica se todas as posições visuais terminaram de interpolar (gravidade visual completa)
     * Retorna true quando todas as células estão na posição lógica (dentro do threshold)
     */
    hasVisualGravityFinished() {
        const threshold = 0.01;
        for (let row = 0; row < this.ysize; row++) {
            for (let col = 0; col < this.xsize; col++) {
                if (this.screenMap[row] && this.screenMap[row][col] !== undefined) {
                    const value = this.screenMap[row][col];
                    // Apenas verifica células com conteúdo (não vazias)
                    if (value !== CONFIG.EMPTY_CELL && value !== CONFIG.MARKED_CELL) {
                        const visualY = this.visualMap && this.visualMap[row] ? this.visualMap[row][col] : row;
                        const diff = Math.abs(visualY - row);
                        // Se alguma célula ainda não terminou de interpolar, retorna false
                        if (diff > threshold) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }

    /**
     * Verifica e processa matches em cadeia (match + gravidade repetido)
     * Integração correta: após cada match, aplica gravidade e verifica novamente
     * NOTA: Esta função agora apenas marca matches, não remove imediatamente
     * @param {boolean} markCells - Se true, marca as células como MARKED_CELL. Se false, apenas retorna as gemas encontradas
     * @returns {Array} Array com todas as pedras marcadas na primeira cadeia, ou null
     */
    checkChained(markCells = true) {
        // Apenas verifica a primeira cadeia de matches (marcação)
        // A remoção e gravidade serão feitas após a animação
        return this.match(markCells);
        }


    /**
     * Procura matches do tabuleiro e marca para quebra (não remove imediatamente)
     * Algoritmo otimizado baseado no Match class
     * @param {boolean} markCells - Se true, marca as células como MARKED_CELL. Se false, apenas retorna as gemas encontradas
     * @returns {Array} Array de objetos {x, y, value, color, visualY} com as pedras marcadas, ou null se não houver matches
     */
    match(markCells = true) {
        // Limpa gemas marcadas anteriores
        this.markedGems = [];
        
        let allMatches = [];

        // Procura matches em todas as posições do tabuleiro
        for (let vertical = 0; vertical < this.screenMap.length; vertical++) {
            for (let horizontal = 0; horizontal < this.screenMap[vertical].length; horizontal++) {
                const matches = this.#walk(vertical, horizontal);
                if (matches.length > 0) {
                    allMatches.push(...matches);
                }
            }
        }

        // Remove duplicatas (um bloco pode estar em múltiplos matches)
        const uniqueMatches = Array.from(
            new Set(allMatches.map(m => `${m.x},${m.y}`))
        ).map(str => {
            const [x, y] = str.split(',').map(Number);
            return {x, y};
        });

        // Coleta informações das pedras antes de marcá-las
        const markedGems = [];

        // Marca os matches para quebra (não remove ainda)
        if (uniqueMatches.length > 0) {
            console.log(`Matches encontrados: ${uniqueMatches.length}`, uniqueMatches);
            uniqueMatches.forEach(match => {
                const value = this.screenMap[match.y][match.x];
                if (value !== CONFIG.EMPTY_CELL && value !== CONFIG.MARKED_CELL) {
                    // Obtém posição visual Y antes de marcar
                    const visualY = this.visualMap && this.visualMap[match.y] ? 
                                   this.visualMap[match.y][match.x] : match.y;
                    
                    const gemInfo = {
                        x: match.x,
                        y: match.y,
                        visualY: visualY, // Salva posição visual
                        value: value,
                        color: getColor(value)
                    };
                    
                    markedGems.push(gemInfo);
                    this.markedGems.push(gemInfo); // Armazena para renderização
                    
                    // Marca a célula apenas se markCells for true
                    if (markCells) {
                        this.screenMap[match.y][match.x] = CONFIG.MARKED_CELL;
                    }
        }
            });
            return markedGems; // Retorna array de pedras marcadas
        }

        return null; // Nenhum match encontrado
    }
    
    /**
     * Remove todas as células marcadas (chamado após animação)
     */
    removeMarkedCells() {
        for (let row = 0; row < this.ysize; row++) {
            for (let col = 0; col < this.xsize; col++) {
                if (this.screenMap[row][col] === CONFIG.MARKED_CELL) {
                    this.screenMap[row][col] = CONFIG.EMPTY_CELL;
                }
            }
        }
        // Limpa gemas marcadas
        this.markedGems = [];
    }
}