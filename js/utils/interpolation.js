/**
 * Utilitários de interpolação visual para animações suaves
 */

/**
 * Interpola um valor visual em direção a um valor lógico
 * @param {number} currentVisual - Valor visual atual (float)
 * @param {number} targetLogical - Valor lógico alvo (int)
 * @param {number} speed - Velocidade de interpolação (0.0 a 1.0)
 * @param {number} threshold - Limiar para fixar na posição exata (padrão 0.01)
 * @returns {number} Novo valor visual interpolado
 */
function interpolate(currentVisual, targetLogical, speed = CONFIG.VISUAL_INTERPOLATION_SPEED, threshold = 0.01) {
  const diff = targetLogical - currentVisual;
  const newValue = currentVisual + (diff * speed);
  
  // Se a diferença for muito pequena, fixa na posição exata (evita jitter)
  if (Math.abs(diff) < threshold) {
    return targetLogical;
  }
  
  return newValue;
}

/**
 * Interpola uma posição 2D (x, y) em direção a uma posição alvo
 * @param {Object} current - Objeto com {x, y} (valores visuais)
 * @param {Object} target - Objeto com {x, y} (valores lógicos)
 * @param {number} speed - Velocidade de interpolação
 * @returns {Object} Novo objeto com {x, y} interpolados
 */
function interpolate2D(current, target, speed = CONFIG.VISUAL_INTERPOLATION_SPEED) {
  return {
    x: interpolate(current.x, target.x, speed),
    y: interpolate(current.y, target.y, speed)
  };
}




