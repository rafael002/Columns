class Screen {
  constructor(boardElement) {
    this.boardElement = boardElement;
    this.visualOffset = CONFIG.VISUAL_OFFSET;
    this.rows = CONFIG.BOARD_HEIGHT - this.visualOffset; // 13 visible rows
    this.cols = CONFIG.BOARD_WIDTH;                      // 6 cols

    // Create one div per visible cell: rows [VISUAL_OFFSET .. BOARD_HEIGHT-1]
    this.cells = [];
    boardElement.innerHTML = '';

    for (let row = 0; row < this.rows; row++) {
      this.cells[row] = [];
      for (let col = 0; col < this.cols; col++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.value = '0';
        boardElement.appendChild(cell);
        this.cells[row][col] = cell;
      }
    }

    // prevMap mirrors visible rows only (index 0 = board row VISUAL_OFFSET)
    this.prevMap = Array.from({ length: this.rows }, () =>
      new Array(this.cols).fill(-1) // -1 forces first full render
    );
  }

  /**
   * Sync DOM to board.screenMap using dirty tracking.
   * Only touches divs whose value changed.
   */
  refresh(board) {
    if (!board || !board.screenMap) {
      console.error('Board ou screenMap não está definido');
      return;
    }

    for (let row = 0; row < this.rows; row++) {
      const boardRow = row + this.visualOffset;
      for (let col = 0; col < this.cols; col++) {
        const val = board.screenMap[boardRow]?.[col] ?? CONFIG.EMPTY_CELL;
        if (val !== this.prevMap[row][col]) {
          this.cells[row][col].dataset.value = val;
          this.prevMap[row][col] = val;
        }
      }
    }
  }
}
