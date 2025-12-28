const CONFIG = {
  // Dimensões do tabuleiro
  BOARD_WIDTH: 6,
  BOARD_HEIGHT: 16,
  
  // Tamanho das peças
  PIECE_SIZE: 3,
  
  // Posição inicial
  INITIAL_X_POSITION: 3,
  INITIAL_Y_POSITION: 0,
  
  // Velocidade do jogo
  GAME_UPDATE_INTERVAL: 500, // ms
  FPS: 60,
  
  // Animação visual
  VISUAL_INTERPOLATION_SPEED: 0.35, // Velocidade de interpolação (0.1 = lento, 0.5 = rápido)
  
  // Dimensões visuais
  BLOCK_SIZE: 41.6,
  VISUAL_OFFSET: 3,
  
  // Valores do tabuleiro
  EMPTY_CELL: 0,
  MARKED_CELL: 9,
  MIN_MATCH_SIZE: 3,
  
  // Sprites
  // NOTA: As configurações de sprites agora estão em js/config/resources.json
  // As configurações abaixo são mantidas apenas para compatibilidade/fallback
  SPRITE_PATH: 'sprites/gems.png', // Deprecated: usar resources.json
  SPRITE_START_X: 0, // Deprecated: usar resources.json
  SPRITE_START_Y: 120, // Deprecated: usar resources.json
  SPRITE_WIDTH: 90, // Deprecated: usar resources.json
  SPRITE_HEIGHT: 90, // Deprecated: usar resources.json
  SPRITE_INTERVALS: [30, 28, 27, 28, 28], // Deprecated: usar resources.json
  SPRITE_FRAME_INTERVALS: [28, 28, 28, 28, 28, 28, 28, 28], // Deprecated: usar resources.json
  SPRITE_SHEET_WIDTH: 579, // Deprecated: usar resources.json
  SPRITE_SHEET_HEIGHT: 90, // Deprecated: usar resources.json
  NUM_GEMS: 6, // Deprecated: usar resources.json
  GEM_ANIMATION_FPS: 10, // Deprecated: usar resources.json
  GEM_ANIMATION_FRAMES: 4, // Deprecated: usar resources.json
  
  // Teclas
  KEYS: {
    SPACE: 32,
    LEFT: 37,
    RIGHT: 39,
    DOWN: 40
  }
};

