/**
 * Sistema de efeitos para pedras explodindo - simplificado
 */
class GemBreakEffect {
  constructor(resourceManager) {
    this.activeEffects = []; // Array de efeitos ativos
    this.resourceManager = resourceManager;
    this.explosionSpriteManager = null;
    
    // Inicializa o SpriteManager para explosão se resourceManager estiver disponível
    if (resourceManager) {
      this.explosionSpriteManager = new SpriteManager(resourceManager, 'explosion');
      this.explosionSpriteManager.load().catch(err => {
        console.warn('Erro ao carregar sprite de explosão:', err);
      });
    }
  }

  /**
   * Cria um efeito de explosão para uma gema
   */
  createBreakEffect(x, y, visualY, color, gemValue, blockSize) {
    this.activeEffects.push({
      x: x,
      y: y,
      visualY: visualY,
      color: color,
      gemValue: gemValue,
      blockSize: blockSize,
      explosionProgress: 0,
      explosionFrame: 0, // Frame atual do sprite de explosão (0-8)
      frame: 0
    });
  }

  /**
   * Atualiza todos os efeitos ativos
   */
  update() {
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      effect.frame++;
      
      // Calcula duração baseada no número de frames do sprite (9 frames)
      const explosionFrames = 9;
      const fps = 10; // animationFPS do sprite de explosão
      const totalDuration = (explosionFrames / fps) * 60; // Converte para frames do jogo (60 FPS)
      effect.explosionProgress = Math.min(1, effect.frame / totalDuration);
      
      // Calcula o frame atual do sprite (0-8)
      effect.explosionFrame = Math.floor(effect.explosionProgress * explosionFrames);
      effect.explosionFrame = Math.min(explosionFrames - 1, effect.explosionFrame);
      
      // Remove efeitos finalizados
      if (effect.explosionProgress >= 1) {
        this.activeEffects.splice(i, 1);
      }
    }
  }

  /**
   * Renderiza todos os efeitos ativos
   */
  render(ctx, screen) {
    for (const effect of this.activeEffects) {
      this.#drawExplosion(ctx, screen, effect);
    }
  }

  /**
   * Desenha explosão usando sprite de explosão
   */
  #drawExplosion(ctx, screen, effect) {
    const x = effect.x * effect.blockSize;
    const y = (effect.visualY - screen.visualOffset) * effect.blockSize;
    const size = effect.blockSize;
    
    // Limpa a área onde a joia estava antes de desenhar a explosão
    // Isso garante que a joia original não apareça por trás
    ctx.fillStyle = COLORS[9]; // Cor de fundo
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    
    // Verifica se o sprite de explosão está carregado
    if (!this.explosionSpriteManager || !this.explosionSpriteManager.loaded) {
      // Fallback: desenha um círculo simples se o sprite não estiver carregado
      ctx.save();
      ctx.fillStyle = `rgba(255, 200, 0, ${1 - effect.explosionProgress})`;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size * 0.5 * (1 + effect.explosionProgress), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    
    // Obtém o frame atual da explosão (0-8)
    const frameIndex = effect.explosionFrame !== undefined ? effect.explosionFrame : 0;
    
    // Obtém as coordenadas do sprite para o frame atual
    const spriteConfig = this.resourceManager.getConfig('sprites', 'explosion');
    if (!spriteConfig) {
      return;
    }
    
    const spriteWidth = spriteConfig.spriteWidth || 100;
    const spriteHeight = spriteConfig.spriteHeight || 100;
    const startX = spriteConfig.startX || 0;
    const startY = spriteConfig.startY || 0;
    const frameIntervals = spriteConfig.frameIntervals || [];
    
    // Calcula a posição Y do frame no sprite sheet
    let sy = startY;
    if (frameIndex > 0) {
      if (frameIntervals.length > 0) {
        // Usa intervalos manuais
        for (let i = 0; i < frameIndex; i++) {
          sy += spriteHeight;
          if (i < frameIntervals.length) {
            sy += frameIntervals[i];
          }
        }
      } else {
        // Espaçamento padrão (altura do frame)
        sy += frameIndex * spriteHeight;
      }
    }
    
    // Desenha o sprite de explosão
    const spriteImage = this.explosionSpriteManager.spriteSheet;
    if (spriteImage) {
      ctx.save();
      // Centraliza a explosão na célula
      const drawX = x;
      const drawY = y;
      
      ctx.drawImage(
        spriteImage,
        startX, sy, spriteWidth, spriteHeight, // Source: posição e tamanho no sprite sheet
        drawX, drawY, size, size // Destination: posição e tamanho no canvas
      );
      ctx.restore();
    }
  }

  /**
   * Verifica se há animações em andamento
   */
  hasActiveEffects() {
    return this.activeEffects.length > 0;
  }

  /**
   * Limpa todos os efeitos
   */
  clear() {
    this.activeEffects = [];
  }
}
