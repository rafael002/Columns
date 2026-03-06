(function() {
  const boardElement = document.getElementById('game-board');
  if (!boardElement) {
    console.error('game-board element not found!');
    return;
  }

  if (typeof CONFIG === 'undefined') {
    console.error('CONFIG não está definido! Verifique se constants.js está carregado.');
    return;
  }

  if (typeof Board === 'undefined' || typeof Piece === 'undefined' || typeof Screen === 'undefined') {
    console.error('Classes não estão definidas! Verifique se os scripts estão carregados.');
    return;
  }

  console.log('Iniciando jogo...');

  const game = new Game(boardElement);

  window.game = game;

  console.log('Jogo iniciado!', game);
})();
