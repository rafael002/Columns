class ExplosionEffect {
  constructor(boardElement, cfg) {
    this.boardElement = boardElement;
    this.cfg = cfg;
    this.cellSize = Math.round(CONFIG.BLOCK_SIZE); // 42px
    this.scale = this.cellSize / cfg.spriteWidth;
    this.effects = [];
    this._preloadImage();
  }

  _preloadImage() {
    const img = new Image();
    img.src = this.cfg.path;
  }

  addEffects(markedGems) {
    const offset = CONFIG.VISUAL_OFFSET;
    const s = this.scale;
    const cfg = this.cfg;
    const bgW = Math.round(cfg.sheetWidth * s);
    const bgH = Math.round(cfg.sheetHeight * s);

    markedGems.forEach(({ col, row }) => {
      const visRow = row - offset;
      if (visRow < 0) return;

      const div = document.createElement('div');
      div.className = 'explosion-effect';
      div.style.left = `${col * this.cellSize}px`;
      div.style.top  = `${visRow * this.cellSize}px`;
      div.style.width  = `${this.cellSize}px`;
      div.style.height = `${this.cellSize}px`;
      div.style.backgroundSize = `${bgW}px ${bgH}px`;
      this.boardElement.appendChild(div);
      this.effects.push({ div, frame: 0, done: false });
    });
  }

  update() {
    const cfg = this.cfg;
    const fps = 10;
    const framesPerSprite = Math.ceil(60 / fps); // 6 rAF frames per sprite frame

    this.effects.forEach(effect => {
      if (effect.done) return;

      const spriteFrame = Math.floor(effect.frame / framesPerSprite);

      if (spriteFrame >= cfg.animationFrames) {
        effect.div.remove();
        effect.done = true;
        return;
      }

      // Calculate sy for this frame (frames are stacked vertically)
      let sy = cfg.startY;
      for (let i = 0; i < spriteFrame; i++) {
        sy += cfg.spriteHeight;
        if (i < cfg.frameIntervals.length) sy += cfg.frameIntervals[i];
      }
      const sx = cfg.startX;
      const s = this.scale;

      effect.div.style.backgroundPosition = `${-(sx * s)}px ${-(sy * s)}px`;
      effect.frame++;
    });

    this.effects = this.effects.filter(e => !e.done);
  }

  isDone() {
    return this.effects.length === 0;
  }
}
