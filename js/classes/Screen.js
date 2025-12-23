class Screen {
  constructor(element) {
    this.canvas = element;
    this.ctx = element.getContext('2d');
    this.width = element.width;
    this.height = element.height;
    this.blockSize = CONFIG.BLOCK_SIZE;
    this.visualOffset = CONFIG.VISUAL_OFFSET;
  }

  /**
   * Redraw a screen
   */
  refresh(board) {
    // cleaning the canvas and buffer
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Verifica se board e screenMap existem
    if (!board || !board.screenMap) {
      console.error('Board ou screenMap não está definido');
      return;
    }

    for (let col = 0; col < board.xsize; col++) {
      for (let row = 0; row < board.ysize; row++) {
        if (board.screenMap[row] && board.screenMap[row][col] !== undefined) {
          const visualRow = row - this.visualOffset;
          // Desenha apenas se estiver na área visível (visualRow >= -visualOffset ou seja, row >= 0)
          if (visualRow >= -this.visualOffset) {
            this.drawBlock(col, visualRow, board.screenMap[row][col]);
          }
        }
      }
    }
  }

  /**
   * Draw a single block
   */
  drawBlock(col, visualRow, value) {
    const x = col * this.blockSize;
    const y = visualRow * this.blockSize;
    const color = getColor(value);
    const innerOffset = 8;
    const innerSize = this.blockSize - 16;

    // Background
    this.ctx.fillStyle = COLORS[0];
    this.ctx.fillRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);

    // Colored block if not empty
    if (value !== CONFIG.EMPTY_CELL) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x + innerOffset, y + innerOffset, innerSize, innerSize);
      this.ctx.strokeStyle = color;
      this.ctx.strokeRect(x + innerOffset, y + innerOffset, innerSize, innerSize);
    }

    // Grid
    this.ctx.strokeStyle = "#CCCCCC";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, this.blockSize, this.blockSize);
  }
}
