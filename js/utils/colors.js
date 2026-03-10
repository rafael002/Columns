const COLORS = {
  0: "#FFFFFF", // Vazio
  1: "#e74c3c", // Vermelho
  2: "#27ae60", // Verde
  3: "#2980b9", // Azul
  4: "#f1c40f", // Amarelo
  5: "#B53471", // Roxo
  6: "#f368e0", // Rosa
  7: "#e67e22", // Laranja
  8: "#A3CB38", // Verde claro
  9: "#000000"  // Preto (marcado)
};

/**
 * Retorna a cor para um valor dado
 */
function getColor(value) {
  return COLORS[value] || COLORS[0];
}

/**
 * Gera um valor aleatório de cor válido (1-8)
 */
function getRandomColor() {
  return Math.floor(Math.random() * 6) + 1;
}

