/**
 * Utilidades para la detección de colisiones
 */

const gameConfig = require("../config/game-config");

const collisionDetector = {
  // Detección de colisión entre jugador y estrella
  detectPlayerStarCollision: (jugador, estrella) => {
    // Usamos hitbox cuadrada (AABB - Axis-Aligned Bounding Box)
    const naveIzquierda = jugador.x;
    const naveDerecha = jugador.x + gameConfig.MIDAJ;
    const naveArriba = jugador.y;
    const naveAbajo = jugador.y + gameConfig.MIDAJ;

    const estrellaIzquierda = estrella.x;
    const estrellaDerecha = estrella.x + gameConfig.MIDAP;
    const estrellaArriba = estrella.y;
    const estrellaAbajo = estrella.y + gameConfig.MIDAP;

    // Hay colisión cuando no hay separación entre los rectángulos
    return (
      naveIzquierda < estrellaDerecha &&
      naveDerecha > estrellaIzquierda &&
      naveArriba < estrellaAbajo &&
      naveAbajo > estrellaArriba
    );
  },

  // Verifica si una posición está dentro de una zona de construcción de pirámide
  isInPyramidZone: (x, y) => {
    const config = gameConfig.getConfig();
    return (
      (x < gameConfig.PHMAX || x > config.width - gameConfig.PHMAX) &&
      (y < gameConfig.PVMAX || y > config.height - gameConfig.PVMAX)
    );
  },

  // Verifica si una posición está en la zona del equipo especificado
  isInTeamZone: (x, y, team) => {
    const config = gameConfig.getConfig();
    if (team === 0) {
      return x < gameConfig.PHMAX && y < gameConfig.PVMAX;
    } else {
      return (
        x > config.width - gameConfig.PHMAX &&
        y > config.height - gameConfig.PVMAX
      );
    }
  },

  // Verifica si un movimiento es válido (no sale del área de juego)
  isValidMove: (x, y) => {
    const config = gameConfig.getConfig();
    return (
      x >= 0 &&
      x <= config.width - 8 * gameConfig.ESCALA &&
      y >= 0 &&
      y <= config.height - 8 * gameConfig.ESCALA
    );
  },
};

module.exports = collisionDetector;
