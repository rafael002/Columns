class Screen {
  constructor(boardElement) {
    this.boardElement = boardElement;
    this.visualOffset = CONFIG.VISUAL_OFFSET;
    this.rows = CONFIG.BOARD_HEIGHT - this.visualOffset; // 13 visible rows
    this.cols = CONFIG.BOARD_WIDTH;
    this.cellSize = Math.round(CONFIG.BLOCK_SIZE); // 42px

    this.spriteReady = false;
    this.gemCfg = null;
    this.scale = 1;
    this.animStart = Date.now();

    // Create grid cells (plain divs, no canvas)
    this.cells = [];
    boardElement.innerHTML = '';

    for (let row = 0; row < this.rows; row++) {
      this.cells[row] = [];
      for (let col = 0; col < this.cols; col++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        boardElement.appendChild(cell);
        this.cells[row][col] = cell;
      }
    }

    // prevMap: -1 forces a full draw on first refresh
    this.prevMap = Array.from({ length: this.rows }, () =>
      new Array(this.cols).fill(-1)
    );

    this._loadSprites();
  }

  _loadSprites() {
    fetch('js/config/resources.json')
      .then(r => r.json())
      .then(config => {
        this.gemCfg = config.sprites.gems;
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = this.gemCfg.path;
        });
      })
      .then(img => {
        this.scale = this.cellSize / this.gemCfg.spriteWidth;
        // Set sheet dimensions once on the board — all cells inherit via CSS vars
        this.boardElement.style.setProperty('--sheet-w', `${img.naturalWidth  * this.scale}px`);
        this.boardElement.style.setProperty('--sheet-h', `${img.naturalHeight * this.scale}px`);
        this.spriteReady = true;
        // Force redraw so cells switch from color fallback to sprites
        for (let row = 0; row < this.rows; row++) this.prevMap[row].fill(-1);
      })
      .catch(err => console.warn('Sprites não carregados, usando cores:', err));
  }

  /**
   * Compute scaled background-position for a gem value and animation frame.
   * frameIndex: null → frame 0 (static), undefined → current animated frame.
   */
  _spritePos(value, frameIndex) {
    const cfg = this.gemCfg;
    const col = Math.min(value - 1, cfg.numSprites - 1); // clamp to available sprites

    // X: sum widths + horizontal intervals up to this column
    let sx = cfg.startX;
    for (let i = 0; i < col; i++) {
      sx += cfg.spriteWidth;
      if (i < cfg.horizontalIntervals.length) sx += cfg.horizontalIntervals[i];
    }

    // Y: pick frame
    let frame = 0;
    if (frameIndex === undefined) {
      const elapsed = Date.now() - this.animStart;
      frame = Math.floor(elapsed / (1000 / cfg.animationFPS)) % cfg.animationFrames;
    }

    let sy = cfg.startY;
    for (let i = 0; i < frame; i++) {
      sy += cfg.spriteHeight;
      if (i < cfg.frameIntervals.length) sy += cfg.frameIntervals[i];
    }

    return { x: -(sx * this.scale), y: -(sy * this.scale) };
  }

  refresh(board, piece) {
    if (!board || !board.screenMap) return;

    // Identify which visible cells belong to the falling piece
    const pieceCells = new Set();
    if (piece) {
      for (let i = 0; i < piece.size; i++) {
        const boardRow = piece.y + i;
        const visRow = boardRow - this.visualOffset;
        if (visRow >= 0 && visRow < this.rows) {
          pieceCells.add(visRow * this.cols + piece.x);
        }
      }
    }

    for (let row = 0; row < this.rows; row++) {
      const boardRow = row + this.visualOffset;
      for (let col = 0; col < this.cols; col++) {
        const val = board.screenMap[boardRow]?.[col] ?? CONFIG.EMPTY_CELL;
        const isPiece = pieceCells.has(row * this.cols + col);

        if (val !== this.prevMap[row][col] || isPiece) {
          this._drawCell(row, col, val, isPiece);
          // Piece cells stay -1 so when the piece moves away (val=0, prevMap=-1 → ≠) the cell is cleared.
          // Without this, prevMap=0 after the first empty draw → piece leaves → val=0==prevMap → no redraw → sprite trail.
          this.prevMap[row][col] = isPiece ? -1 : val;
        }
      }
    }
  }

  _drawCell(row, col, value, animated) {
    const cell = this.cells[row][col];

    if (value === CONFIG.EMPTY_CELL || value === CONFIG.MARKED_CELL) {
      cell.classList.remove('has-gem');
      cell.style.removeProperty('--sprite-x');
      cell.style.removeProperty('--sprite-y');
      cell.dataset.value = value;
      return;
    }

    cell.dataset.value = value; // color fallback (CSS handles it)

    if (this.spriteReady) {
      const { x, y } = this._spritePos(value, animated ? undefined : null);
      cell.style.setProperty('--sprite-x', `${x}px`);
      cell.style.setProperty('--sprite-y', `${y}px`);
      cell.classList.add('has-gem');
    }
  }
}
