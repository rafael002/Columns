class Game {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.resourceManager = null;
    this.spriteManager = null;
    
    // Carrega o JSON de recursos primeiro
    this.loadResources();
  }

  /**
   * Carrega o arquivo JSON de recursos e inicializa o ResourceManager
   */
  async loadResources() {
    try {
      const response = await fetch('js/config/resources.json');
      if (!response.ok) {
        throw new Error(`Erro ao carregar resources.json: ${response.statusText}`);
      }
      
      const resourcesConfig = await response.json();
      this.resourceManager = new ResourceManager(resourcesConfig);
      
      // Cria o SpriteManager com o ResourceManager
      this.spriteManager = new SpriteManager(this.resourceManager, 'gems');
      
      // Carrega os sprites
      await this.spriteManager.load();
      
      // Inicializa o jogo após carregar os recursos
      this.initGame();
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
      // Tenta iniciar o jogo mesmo com erro (usará fallback)
      this.initGame();
    }
  }

  /**
   * Inicializa o jogo após o carregamento dos sprites
   */
  initGame() {
    // Se spriteManager não foi carregado, cria um fallback
    if (!this.spriteManager) {
      console.warn('SpriteManager não disponível, criando fallback');
      // Cria um ResourceManager vazio como fallback
      this.resourceManager = new ResourceManager({ sprites: {}, audio: {}, images: {} });
      this.spriteManager = new SpriteManager(this.resourceManager, 'gems');
    }

    this.board = new Board(CONFIG.BOARD_WIDTH, CONFIG.BOARD_HEIGHT);
    this.piece = new Piece();
    this.nextPiece = new Piece(); // Próxima peça para preview
    this.screen = new Screen(this.canvas, this.spriteManager);
    const previewCanvas = document.getElementById('preview-canvas');
    this.previewScreen = previewCanvas ? new Screen(previewCanvas, this.spriteManager) : null;
    this.inputHandler = new InputHandler(this);
    this.breakEffect = new GemBreakEffect(this.resourceManager);
    
    this.level = 1;
    this.score = 0;

    // flags area
    this.gameOver = false;
    this.showRetryButton = false;
    this.isWaitingForAnimation = false;
    this.pendingPieceSwap = false; // Flag para indicar que uma peça foi colocada e está aguardando troca
    
    // debug flags
    this.debugMode = true; // Padrão: debug on
    this.isWaitingForDebug = false;

    this.setupClickHandler();
    this.setupDebugControls();
    this.startGameLoop();
    this.startUpdateLoop();
  }
  
  /**
   * Configura o handler de clique para o botão de retry
   */
  setupClickHandler() {
    this.canvas.addEventListener('click', (event) => {
      if (!this.screen) return;
      
      if (this.showRetryButton) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const buttonBounds = this.screen.getRetryButtonBounds();
        if (x >= buttonBounds.x && x <= buttonBounds.x + buttonBounds.width &&
            y >= buttonBounds.y && y <= buttonBounds.y + buttonBounds.height) {
          this.restart();
        }
      }
    });
  }

  /**
   * Configura os controles de debug (checkbox e botão continue)
   */
  setupDebugControls() {
    const debugCheckbox = document.getElementById('debug-checkbox');
    const continueButton = document.getElementById('continue-button');
    
    if (!debugCheckbox || !continueButton) {
      console.warn('Controles de debug não encontrados no DOM');
      return;
    }
    
    // Inicializa o checkbox com o valor padrão
    debugCheckbox.checked = this.debugMode;
    
    // Listener do checkbox
    debugCheckbox.addEventListener('change', (event) => {
      this.debugMode = event.target.checked;
      // Se desativar debug durante uma pausa, continua automaticamente
      if (!this.debugMode && this.isWaitingForDebug) {
        this.continueFromDebug();
      }
    });
    
    // Listener do botão continue
    continueButton.addEventListener('click', () => {
      this.continueFromDebug();
    });
  }

  /**
   * Loop de renderização (60 FPS)
   */
  startGameLoop() {
    const render = () => {
      this.render();
      window.requestAnimationFrame(render);
    };
    render();
  }

  /**
   * Loop de atualização do jogo (lógica)
   */
  startUpdateLoop() {
    setInterval(() => {
      if (!this.gameOver) {
        this.update();
      }
    }, CONFIG.GAME_UPDATE_INTERVAL);
  }

  /**
   * Renderiza o jogo
   */
  render() {
    try {
      // Não renderiza se o jogo ainda não foi inicializado
      if (!this.board || !this.screen) {
        return;
      }

      this.breakEffect.update();
      
      if (this.gameOver) {
        // Durante game over, renderiza o tabuleiro (se ainda tiver pedras) e efeitos
        this.board.updateVisualPositions();
        this.screen.refresh(this.board);
        this.breakEffect.render(this.screen.ctx, this.screen);
        
        // Desenha botão de retry apenas após todas as animações terminarem
        if (this.showRetryButton) {
          this.screen.drawRetryButton(this.score);
        }
      } else {
        this.piece.updateVisualPosition();
        this.board.updateVisualPositions();
        this.screen.refresh(this.board, this.debugMode && this.isWaitingForDebug);
        this.screen.drawPiece(this.piece);
        this.breakEffect.render(this.screen.ctx, this.screen);
        
        // Desenha preview da próxima peça
        if (this.previewScreen && this.nextPiece) {
          this.previewScreen.drawNextPiecePreview(this.nextPiece);
        }
      }
    } catch (error) {
      console.error('Erro ao renderizar:', error);
    }
  }

  /**
   * Atualiza a lógica do jogo
   */
  update() {
    // Não atualiza se o jogo ainda não foi inicializado
    if (!this.board || !this.piece) {
      return;
    }

    // Pausa completamente se estiver esperando debug
    if (this.isWaitingForDebug) {
      return;
    }

    if (!this.breakEffect.hasActiveEffects()) {
      // Aplica gravidade logicamente
      this.board.gravity();
      
      // Só verifica matches após a gravidade visual terminar (peças pararem de cair)
      // Isso evita verificar matches enquanto as peças ainda estão visualmente caindo
      if (this.board.hasVisualGravityFinished()) {
        const markCells = !this.debugMode;
        const newMatches = this.board.checkChained(markCells);
        this.#startBreakAnimation(newMatches);
        
        // Se não houver novos matches e há uma troca de peça pendente, realiza a troca
        if (this.pendingPieceSwap && (!newMatches || newMatches.length === 0)) {
          this.pendingPieceSwap = false;
          // Troca a peça atual pela próxima e gera uma nova próxima
          this.piece = this.nextPiece;
          this.piece.resetPosition(); // Reseta apenas a posição, mantém as gemas
          this.nextPiece = new Piece(); // Gera nova peça para preview
        }
        
        this.isWaitingForAnimation = false;
      } else {
        // Gravidade visual ainda não terminou, mantém esperando
        this.isWaitingForAnimation = true;
      }
    }

    if (!this.isWaitingForAnimation) {
      if (this.board.checkCollision(0, 1, this.piece)) {
        this.piece.downPiece();
        return;
      }
          
      if (this.piece.y > 0) {
        // Adiciona a peça ao tabuleiro permanentemente
        this.board.addCurrentPiece(this.piece);
        
        // Move a peça para fora da área visível (parte escondida) antes de iniciar validações
        // Isso evita que a peça apareça na tela durante as animações de explosão
        this.piece.resetPosition();
        
        // Verifica game over: se há joias na parte invisível do tabuleiro
        // (linhas 0 até VISUAL_OFFSET - 1)
        let hasGemsInInvisibleArea = false;
        for (let row = 0; row < CONFIG.VISUAL_OFFSET; row++) {
          for (let col = 0; col < this.board.xsize; col++) {
            if (this.board.screenMap[row] && 
                this.board.screenMap[row][col] !== undefined &&
                this.board.screenMap[row][col] !== CONFIG.EMPTY_CELL &&
                this.board.screenMap[row][col] !== CONFIG.MARKED_CELL) {
              hasGemsInInvisibleArea = true;
              break;
            }
          }
          if (hasGemsInInvisibleArea) break;
        }
        
        if (hasGemsInInvisibleArea) {
          // Game over: há joias na área invisível
          this.endGame();
          return;
        }
        
        // Verifica matches (em modo debug não marca células, apenas identifica)
        const markCells = !this.debugMode;
        const markedGems = this.board.checkChained(markCells);
        this.#startBreakAnimation(markedGems);
        
        // Se houver matches, marca como esperando animação e pendencia de troca
        if (markedGems && markedGems.length > 0) {
          this.isWaitingForAnimation = true;
          this.pendingPieceSwap = true; // Marca que precisa trocar a peça quando animações terminarem
          return;
        }
        
        // Só troca a peça se não houver matches/animações
        // Troca a peça atual pela próxima e gera uma nova próxima
        this.piece = this.nextPiece;
        this.piece.resetPosition(); // Reseta apenas a posição, mantém as gemas
        this.nextPiece = new Piece(); // Gera nova peça para preview
        return;
      }
      this.endGame();
    }
  }
  
  /**
   * Inicia animação de quebra para as gemas marcadas
   */
  #startBreakAnimation(markedGems) {
    if (!this.screen) return;
    
    if (markedGems && markedGems.length > 0) {
      // Se estiver em modo debug, pausa o jogo (sem marcar células)
      if (this.debugMode) {
        this.isWaitingForDebug = true;
        this.isWaitingForAnimation = true;
        const continueButton = document.getElementById('continue-button');
        if (continueButton) {
          continueButton.style.display = 'block';
        }
        console.log('DEBUG: Match encontrado!', markedGems);
        return; // Para aqui, não inicia a animação ainda
      }
      
      // Modo normal: marca células e inicia animação imediatamente
      this.isWaitingForAnimation = true;
      
      // Salva as informações das joias antes de removê-las (removeMarkedCells limpa markedGems)
      const gemsToExplode = [...markedGems];
      
      // Remove as células marcadas ANTES de criar os efeitos
      // Isso garante que no próximo render a célula já estará vazia
      this.board.removeMarkedCells();
      
      // Cria os efeitos de explosão usando as informações salvas
      gemsToExplode.forEach(gem => {
        this.breakEffect.createBreakEffect(
          gem.x,
          gem.y,
          gem.visualY,
          gem.color,
          gem.value,
          this.screen.blockSize
        );
      });
    }
  }

  /**
   * Continua o jogo após a pausa de debug
   */
  continueFromDebug() {
    if (!this.board || !this.screen) return;
    
    this.isWaitingForDebug = false;
    const continueButton = document.getElementById('continue-button');
    if (continueButton) {
      continueButton.style.display = 'none';
    }
    
    // Marca as células agora que o usuário confirmou
    if (this.board.markedGems && this.board.markedGems.length > 0) {
      this.board.markedGems.forEach(gem => {
        this.board.screenMap[gem.y][gem.x] = CONFIG.MARKED_CELL;
      });
      
      // Inicia a animação de quebra das gemas marcadas
      this.isWaitingForAnimation = true;
      
      // Salva as informações das joias antes de removê-las (removeMarkedCells limpa markedGems)
      const gemsToExplode = [...this.board.markedGems];
      
      // Remove as células marcadas ANTES de criar os efeitos
      // Isso garante que no próximo render a célula já estará vazia
      this.board.removeMarkedCells();
      
      // Cria os efeitos de explosão usando as informações salvas
      gemsToExplode.forEach(gem => {
        this.breakEffect.createBreakEffect(
          gem.x,
          gem.y,
          gem.visualY,
          gem.color,
          gem.value,
          this.screen.blockSize
        );
      });
    }
  }

  /**
   * Finaliza o jogo - explode todas as pedras do tabuleiro
   */
  endGame() {
    if (!this.board || !this.screen) return;
    
    if (this.gameOver) return; // Evita chamadas múltiplas
    this.gameOver = true;
    this.showRetryButton = false;
    
    // Coleta todas as células do tabuleiro para explodir (incluindo vazias)
    const allGems = [];
    for (let row = 0; row < this.board.ysize; row++) {
      for (let col = 0; col < this.board.xsize; col++) {
        const value = this.board.screenMap[row][col];
        // Inclui todas as células, mesmo as vazias
        // Para células vazias, usa valor 0 e cor padrão
        const visualY = this.board.visualMap && this.board.visualMap[row] ? 
                       this.board.visualMap[row][col] : row;
        
        allGems.push({
          x: col,
          y: row,
          visualY: visualY,
          value: value === CONFIG.EMPTY_CELL || value === CONFIG.MARKED_CELL ? 0 : value,
          color: value === CONFIG.EMPTY_CELL || value === CONFIG.MARKED_CELL ? '#666666' : getColor(value)
        });
      }
    }
    
    // Ordena de baixo para cima (maior Y primeiro, depois maior X)
    allGems.sort((a, b) => {
      if (b.y !== a.y) {
        return b.y - a.y; // Maior Y primeiro (baixo para cima)
      }
      return b.x - a.x; // Se mesma linha, maior X primeiro
    });
    
    // Marca todas as pedras para quebra (para não renderizar enquanto explodem)
    allGems.forEach(gem => {
      this.board.screenMap[gem.y][gem.x] = CONFIG.MARKED_CELL;
    });
    
    // Cria efeitos de explosão de baixo para cima (com delay escalonado)
    allGems.forEach((gem, index) => {
      setTimeout(() => {
        this.breakEffect.createBreakEffect(
          gem.x,
          gem.y,
          gem.visualY,
          gem.color,
          gem.value,
          this.screen.blockSize
        );
      }, index * 25); // Delay de 25ms entre cada explosão para efeito em cascata
    });
    
    // Remove as células marcadas imediatamente após criar todos os efeitos
    // Assim quando as animações terminarem, o espaço já estará vazio
    setTimeout(() => {
      this.board.removeMarkedCells();
    }, allGems.length * 25); // Espera criar todos os efeitos antes de limpar
    
    // Calcula o tempo total da animação
    // Última explosão começa em: (allGems.length - 1) * 25ms
    // Duração da animação de cada explosão: ~1500ms (rachadura + explosão)
    const totalAnimationTime = (allGems.length - 1) * 25 + 1500;
    
    // Limpa o tabuleiro após todas as explosões terminarem
    setTimeout(() => {
      this.board.resetBoard();
    }, totalAnimationTime);
    
    // Mostra o botão de retry após todas as animações terminarem
    setTimeout(() => {
      this.showRetryButton = true;
    }, totalAnimationTime);
  }
  
  /**
   * Reinicia o jogo completamente
   */
  restart() {
    if (!this.board || !this.piece) return;
    
    this.board.resetBoard();
    this.piece.reset();
    this.nextPiece.reset(); // Reset da próxima peça também
    this.breakEffect.clear();
    this.level = 1;
    this.score = 0;
    this.gameOver = false;
    this.showRetryButton = false;
    this.isWaitingForAnimation = false;
    this.pendingPieceSwap = false;
  }

  /**
   * Verifica se o jogo acabou
   */
  isGameOver() {
    return this.gameOver;
  }

  /**
   * Verifica se o player pode controlar a peça
   * Retorna false se há animações em andamento ou se está esperando
   */
  canPlayerControl() {
    return !this.gameOver && 
           !this.isWaitingForAnimation && 
           !this.isWaitingForDebug && 
           !this.breakEffect.hasActiveEffects();
  }

  /**
   * Retorna a peça atual (para InputHandler)
   */
  getCurrentPiece() {
    return this.piece;
  }

  /**
   * Retorna o tabuleiro (para InputHandler)
   */
  getBoard() {
    return this.board;
  }

  /**
   * Reinicia o jogo (método legado - usar restart() agora)
   */
  reset() {
    this.restart();
  }
}

