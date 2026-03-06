/**
 * Gerenciador de sprites para as gemas
 * Agora usa ResourceManager para carregar recursos do JSON
 */
class SpriteManager {
  constructor(resourceManager, spriteKey = 'gems') {
    this.resourceManager = resourceManager;
    this.spriteKey = spriteKey;
    this.spriteSheet = null;
    this.config = null;
    this.isLoaded = false;
    this.loadPromise = null;
    this.animationStartTime = Date.now();
  }

  /**
   * Carrega o sprite sheet usando ResourceManager
   * @returns {Promise} Promise que resolve quando o sprite sheet é carregado
   */
  load() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.resourceManager.loadResource('sprites', this.spriteKey)
      .then(resource => {
        this.spriteSheet = resource.image;
        this.config = resource.config;
        this.isLoaded = true;
        this.animationStartTime = Date.now();
        return resource.image;
      })
      .catch(error => {
        console.error(`Erro ao carregar sprite ${this.spriteKey}:`, error);
        throw error;
      });

    return this.loadPromise;
  }

  /**
   * Calcula o frame atual da animação baseado no tempo
   * @returns {number} Índice do frame atual (0 a animationFrames-1)
   */
  getCurrentFrame() {
    if (!this.config) {
      return 0;
    }

    const animationFrames = this.config.animationFrames || 1;
    if (animationFrames <= 1) {
      return 0;
    }
    
    const elapsed = Date.now() - this.animationStartTime;
    const animationFPS = this.config.animationFPS || 10;
    const frameDuration = 1000 / animationFPS; // Duração de cada frame em ms
    const currentFrame = Math.floor((elapsed / frameDuration) % animationFrames);
    
    return currentFrame;
  }

  /**
   * Obtém as coordenadas de recorte (sx, sy) no sprite sheet para uma gema e frame específicos
   * @param {number} gemValue - Valor da gema (1-6)
   * @param {number} frameIndex - Índice do frame (0 a GEM_ANIMATION_FRAMES-1). Se null, usa frame 0 (sem animação). Se não fornecido, usa frame atual animado
   * @returns {{sx: number, sy: number, width: number, height: number}} Coordenadas de recorte
   */
  getSpriteCoords(gemValue, frameIndex = undefined) {
    if (!this.isLoaded || !this.config) {
      console.warn('Sprite sheet não carregado ainda');
      const defaultWidth = this.config?.spriteWidth || 90;
      const defaultHeight = this.config?.spriteHeight || 90;
      return { sx: 0, sy: 0, width: defaultWidth, height: defaultHeight };
    }

    const numSprites = this.config.numSprites || 6;
    const spriteWidth = this.config.spriteWidth || 90;
    const spriteHeight = this.config.spriteHeight || 90;
    const startX = this.config.startX || 0;
    const startY = this.config.startY || 0;
    const horizontalIntervals = this.config.horizontalIntervals || [];
    const frameIntervals = this.config.frameIntervals || [];
    const animationFrames = this.config.animationFrames || 1;

    // Valida gemValue
    const validGemValue = Math.max(1, Math.min(numSprites, gemValue));
    
    // Coluna = gemValue - 1 (gema 1 está na coluna 0)
    const col = validGemValue - 1;
    
    // Determina o frame: se frameIndex é null, usa 0 (sem animação), se undefined, usa frame animado atual
    let frame;
    if (frameIndex === null) {
      frame = 0; // Frame fixo 0 para gemas no tabuleiro
    } else if (frameIndex === undefined) {
      frame = this.getCurrentFrame(); // Frame animado para peça controlada
    } else {
      frame = Math.max(0, Math.min(animationFrames - 1, frameIndex));
    }

    // Calcula coordenadas X no sprite sheet
    // Começa do ponto inicial definido em startX
    // Calcula a posição X somando a largura das gemas anteriores e seus intervalos
    let sx = startX;
    for (let i = 0; i < col; i++) {
      sx += spriteWidth; // Largura da gema
      if (i < horizontalIntervals.length) {
        sx += horizontalIntervals[i]; // Espaçamento após a gema
      }
    }
    
    // Calcula coordenadas Y no sprite sheet (posição vertical do frame)
    // Começa do ponto inicial definido em startY
    // Se não há intervalos de frame definidos, assume espaçamento padrão
    let sy = startY;
    if (frame > 0) {
      if (frameIntervals.length > 0) {
        // Usa intervalos manuais para calcular a posição Y
        for (let i = 0; i < frame; i++) {
          sy += spriteHeight; // Altura do frame
          if (i < frameIntervals.length) {
            sy += frameIntervals[i]; // Espaçamento após o frame
          }
        }
      } else {
        // Fallback: espaçamento padrão (altura do frame)
        sy += frame * spriteHeight;
      }
    }

    return {
      sx: sx,
      sy: sy,
      width: spriteWidth,
      height: spriteHeight
    };
  }

  /**
   * Desenha uma gema no canvas usando o sprite sheet
   * @param {CanvasRenderingContext2D} ctx - Context do canvas
   * @param {number} x - Posição X no canvas
   * @param {number} y - Posição Y no canvas
   * @param {number} width - Largura de destino
   * @param {number} height - Altura de destino
   * @param {number} gemValue - Valor da gema (1-6)
   * @param {number|null|undefined} frameIndex - Frame específico: null = frame 0 (sem animação), undefined = animação completa, number = frame específico
   */
  drawGem(ctx, x, y, width, height, gemValue, frameIndex = null) {
    if (!this.isLoaded || !this.spriteSheet) {
      console.warn('Tentativa de desenhar sprite antes do carregamento');
      return;
    }

    const coords = this.getSpriteCoords(gemValue, frameIndex);
    
    ctx.drawImage(
      this.spriteSheet,
      coords.sx, coords.sy, coords.width, coords.height, // Source: posição e tamanho no sprite sheet
      x, y, width, height // Destination: posição e tamanho no canvas
    );
  }

  /**
   * Verifica se o sprite sheet está carregado
   * @returns {boolean}
   */
  get loaded() {
    return this.isLoaded;
  }
}
