class Screen {
  constructor(element, spriteManager) {
    this.canvas = element;
    this.ctx = element.getContext('2d');
    this.width = element.width;
    this.height = element.height;
    this.blockSize = CONFIG.BLOCK_SIZE;
    this.visualOffset = CONFIG.VISUAL_OFFSET;
    this.spriteManager = spriteManager;
  }

  /**
   * Converte cor hex para RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 128, g: 128, b: 128};
  }

  /**
   * Desenha uma pedra preciosa usando sprite sheet
   * @param {number} x - Posição X no canvas
   * @param {number} y - Posição Y no canvas
   * @param {number} size - Tamanho da gema
   * @param {string} baseColor - Cor base (mantido para compatibilidade, não usado mais)
   * @param {number} gemValue - Valor da gema (1-6)
   */
  drawGem(x, y, size, baseColor, gemValue) {
    // Método mantido para compatibilidade, mas não é mais usado
    // Use spriteManager.drawGem diretamente com frameIndex apropriado
    if (this.spriteManager && this.spriteManager.loaded) {
      // Por padrão, usa frame 0 (sem animação)
      this.spriteManager.drawGem(this.ctx, x, y, size, size, gemValue, null);
    } else {
      // Fallback: desenha um retângulo simples se sprite não estiver carregado
      this.ctx.fillStyle = getColor(gemValue);
      this.ctx.fillRect(x, y, size, size);
    }
  }

  /**
   * Redraw a screen
   */
  refresh(board, highlightMarked = false) {
    // cleaning the canvas and buffer
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Verifica se board e screenMap existem
    if (!board || !board.screenMap) {
      console.error('Board ou screenMap não está definido');
      return;
    }

    // Calcula quantas linhas são visíveis
    const visibleRows = Math.ceil(this.height / this.blockSize);
    
    // Primeiro, desenha todas as células vazias da grade visível (background)
    for (let visualRow = -this.visualOffset; visualRow < visibleRows; visualRow++) {
      for (let col = 0; col < board.xsize; col++) {
        // Desenha célula vazia como background
        const x = col * this.blockSize;
        const y = visualRow * this.blockSize;
        this.ctx.fillStyle = COLORS[9];
        this.ctx.fillRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);
        this.ctx.strokeStyle = "#CCCCCC";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.blockSize, this.blockSize);
      }
    }
    
    // Depois, desenha todas as células com conteúdo usando a posição visual para interpolação
    for (let row = 0; row < board.ysize; row++) {
      for (let col = 0; col < board.xsize; col++) {
        if (board.screenMap[row] && board.screenMap[row][col] !== undefined) {
          const value = board.screenMap[row][col];
          
          // Pula células vazias (já foram desenhadas como background)
          if (value === CONFIG.EMPTY_CELL) {
            continue;
          }
          
          // Pula células marcadas - elas serão substituídas pela animação de explosão
          if (value === CONFIG.MARKED_CELL) {
            continue;
          }
          
          const visualY = board.visualMap && board.visualMap[row] ? board.visualMap[row][col] : row;
          const visualRow = visualY - this.visualOffset;
          if (visualRow >= -this.visualOffset - 1 && visualRow < visibleRows) {
            this.drawBlock(col, visualRow, value, null, highlightMarked && false);
          }
        }
      }
    }
  }

  /**
   * Draw a single block
   */
  drawBlock(col, visualRow, value, gemInfo = null, highlightMarked = false) {
    const x = col * this.blockSize;
    const y = visualRow * this.blockSize;
    const color = gemInfo ? gemInfo.color : getColor(value);
    const gemValue = gemInfo ? gemInfo.value : value;
    const innerOffset = 2;
    const innerSize = this.blockSize - 4;

    // Background (sempre desenha para garantir que não fique espaço em branco)
    this.ctx.fillStyle = COLORS[9];
    this.ctx.fillRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);

    // Desenha pedra preciosa se não for vazio
    // Gemas no tabuleiro sempre usam frame 0 (sem animação)
    // Células marcadas são puladas no refresh() e substituídas pela animação de explosão
    if (value !== CONFIG.EMPTY_CELL && value !== CONFIG.MARKED_CELL) {
      this.spriteManager.drawGem(this.ctx, x + innerOffset, y + innerOffset, innerSize, innerSize, gemValue, null);
    }

    // Destaca visualmente se estiver em modo debug
    if (highlightMarked) {
      this.ctx.save();
      // Borda destacada pulsante
      const pulseAlpha = 0.7 + Math.sin(Date.now() / 150) * 0.3;
      this.ctx.strokeStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(x - 1, y - 1, this.blockSize + 2, this.blockSize + 2);
      
      // Overlay amarelo semi-transparente
      this.ctx.fillStyle = `rgba(255, 255, 0, 0.3)`;
      this.ctx.fillRect(x, y, this.blockSize, this.blockSize);
      this.ctx.restore();
    }

    // Grid (sempre desenha para manter a grade visível)
    this.ctx.strokeStyle = "#CCCCCC";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, this.blockSize, this.blockSize);
  }

  /**
   * Desenha uma peça com posição visual suave (para animação)
   */
  drawPiece(piece) {
    const x = piece.visualX * this.blockSize;
    const startY = (piece.visualY - this.visualOffset) * this.blockSize;
    const innerOffset = 2;
    const innerSize = this.blockSize - 4;

    for (let i = 0; i < piece.size; i++) {
      const y = startY + (i * this.blockSize);
      const color = getColor(piece.rocks[i]);

      // Background
      this.ctx.strokeRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);

      // Desenha pedra preciosa com animação completa (peça controlada pelo player)
      this.spriteManager.drawGem(this.ctx, x + innerOffset, y + innerOffset, innerSize, innerSize, piece.rocks[i], undefined);

      // Grid
      this.ctx.strokeStyle = `rgba(248, 35, 35, 1)`;;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, this.blockSize, this.blockSize);
    }
  }
  
  /**
   * Desenha botão de retry
   */
  drawRetryButton(score) {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const buttonWidth = 150;
    const buttonHeight = 50;
    const buttonX = centerX - buttonWidth / 2;
    const buttonY = centerY - buttonHeight / 2;
    
    // Fundo semi-transparente escuro
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Background do botão com gradiente
    const buttonGradient = this.ctx.createLinearGradient(
      buttonX, buttonY,
      buttonX, buttonY + buttonHeight
    );
    buttonGradient.addColorStop(0, '#4CAF50');
    buttonGradient.addColorStop(1, '#45a049');
    
    // Sombra do botão
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 4;
    
    // Botão com bordas arredondadas
    this.ctx.fillStyle = buttonGradient;
    this.ctx.beginPath();
    const radius = 10;
    this.ctx.moveTo(buttonX + radius, buttonY);
    this.ctx.lineTo(buttonX + buttonWidth - radius, buttonY);
    this.ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY, buttonX + buttonWidth, buttonY + radius);
    this.ctx.lineTo(buttonX + buttonWidth, buttonY + buttonHeight - radius);
    this.ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY + buttonHeight, buttonX + buttonWidth - radius, buttonY + buttonHeight);
    this.ctx.lineTo(buttonX + radius, buttonY + buttonHeight);
    this.ctx.quadraticCurveTo(buttonX, buttonY + buttonHeight, buttonX, buttonY + buttonHeight - radius);
    this.ctx.lineTo(buttonX, buttonY + radius);
    this.ctx.quadraticCurveTo(buttonX, buttonY, buttonX + radius, buttonY);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Remove sombra
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Borda do botão
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Texto "Retry"
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Retry', centerX, centerY);
    
    // Pontuação acima do botão
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Score: ${score}`, centerX, centerY - 50);
  }
  
  /**
   * Retorna as coordenadas do botão de retry (para detecção de clique)
   */
  getRetryButtonBounds() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const buttonWidth = 150;
    const buttonHeight = 50;
    return {
      x: centerX - buttonWidth / 2,
      y: centerY - buttonHeight / 2,
      width: buttonWidth,
      height: buttonHeight
    };
  }

  /**
   * Desenha o preview da próxima peça (com animação completa)
   */
  drawNextPiecePreview(piece) {
    // Limpa o canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Background
    this.ctx.fillStyle = COLORS[0];
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Título
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Next', this.width / 2, 15);
    
    // Usa o mesmo tamanho de bloco do tabuleiro
    const blockSize = this.blockSize;
    const startX = (this.width - blockSize) / 2;
    const startY = 25;
    const innerOffset = 1; // Bordas menores
    const innerSize = blockSize - 2;
    
    // Desenha cada gema da peça com animação completa
    for (let i = 0; i < piece.size; i++) {
      const x = startX;
      const y = startY + (i * blockSize);
      const color = getColor(piece.rocks[i]);
      
      // Background do bloco
      this.ctx.fillStyle = COLORS[9];
      this.ctx.fillRect(x + 1, y + 1, blockSize - 2, blockSize - 2);
      
      // Desenha gema com animação completa (undefined = animação)
      this.spriteManager.drawGem(
        this.ctx, 
        x + innerOffset, 
        y + innerOffset, 
        innerSize, 
        innerSize, 
        piece.rocks[i], 
        undefined // Animação completa
      );
      
      // Grid
      this.ctx.strokeStyle = "#CCCCCC";
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, blockSize, blockSize);
    }
  }
}

// Polyfill para roundRect (caso navegador não suporte)
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}
