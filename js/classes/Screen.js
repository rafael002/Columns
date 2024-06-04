class Screen{ // trocar nomepara algo como tabuleiro
  constructor(element){
    this.screen = element.getContext('2d');
    this.width = element.offsetWidth;
    this.height = element.offsetHeight;
  }

  /**
  * Redraw a screen
  */
  refresh(board) {
    // cleaning the canvas and buffer
    this.screen.clearRect(0, 0, this.width, this.height);
    // TODO remove after fix clearRect

    for(let i = 0; i < board.xsize; i++) {
      for(let j = 0; j < board.ysize; j++) {
        // color selection
        switch(board.screenMap[j][i]) {
          case 0:
            this.screen.fillStyle="#FFFFFF";
          break;
          case 1:
            this.screen.fillStyle="#e74c3c";
          break;
          case 2:
            this.screen.fillStyle="#27ae60";
          break;
          case 3:
            this.screen.fillStyle="#2980b9";
          break;
          case 4:
              this.screen.fillStyle="#f1c40f";
          break;
          case 5:
              this.screen.fillStyle="#B53471";
          break;
          case 6:
              this.screen.fillStyle="#f368e0";
          break;
          case 7:
              this.screen.fillStyle="#e67e22";
          break;
          case 8:
              this.screen.fillStyle="#A3CB38";
          break;
          case 9:
            this.screen.fillStyle="#000000";
          break;
        }

        // draw blocks
        this.screen.beginPath();
          // if(this.screenMap[j][i] !== 0){
          this.screen.fillRect(i * 41.6 + 1, (j - 3) * 41.6 + 1, 40.6, 40.6);
          // change color back to white
          this.screen.fillStyle="#FFFFFF";
          this.screen.fillRect(i * 41.6 + 8, (j - 3) * 41.6 + 8, 25.6, 25.6);
          if( board.screenMap[j][i] !== 0 ){
            this.screen.strokeRect(i * 41.6 + 8, (j - 3) * 41.6 + 8, 25.6, 25.6);
          }
        // }
        // draw grid
        this.screen.strokeRect(i * 41.6, (j - 3) * 41.6, 41.6, 41.6);
        this.screen.closePath();
      }
    }
  }
}
