(function() {
  const canvas = document.getElementById('p1');
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Verifica se as dependências estão carregadas
  if (typeof CONFIG === 'undefined') {
    console.error('CONFIG não está definido! Verifique se constants.js está carregado.');
    return;
  }

  if (typeof Board === 'undefined' || typeof Piece === 'undefined' || typeof Screen === 'undefined') {
    console.error('Classes não estão definidas! Verifique se os scripts estão carregados.');
    return;
  }

  console.log('Iniciando jogo...');
  
  // Inicia o jogo
  const game = new Game(canvas);
  
  // Expõe o jogo globalmente para debug (opcional)
  window.game = game;
  
  console.log('Jogo iniciado!', game);
})();
