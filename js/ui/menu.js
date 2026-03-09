(function () {
  const gods = [
    '⚡', // Zeus      — raio
    'Ψ',  // Poseidon  — tridente (psi grego)
    '☿',  // Hermes    — caduceu
    '⚔',  // Ares      — espadas cruzadas
    '☀',  // Apollo    — sol
    '☽',  // Artemis   — lua crescente
    '⚒',  // Hefesto   — martelo
    '⚖',  // Temis     — balança
  ];

  const i1 = Math.floor(Math.random() * gods.length);
  let i2;
  do { i2 = Math.floor(Math.random() * gods.length); } while (i2 === i1);

  document.getElementById('orb-icon-left').textContent  = gods[i1];
  document.getElementById('orb-icon-right').textContent = gods[i2];
})();
