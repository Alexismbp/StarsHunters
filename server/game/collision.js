/* Utilitats per a la detecció de col·lisions */

const gameConfig = require("../config/game-config");

const collisionDetector = {
  // Detecta col·lisió entre jugador i estrella
  detectPlayerStarCollision: (jugador, estrella) => {
    // Fem servir hitbox quadrada (AABB)
    const naveIzquierda = jugador.x;
    const naveDerecha = jugador.x + gameConfig.MIDAJ;
    const naveArriba = jugador.y;
    const naveAbajo = jugador.y + gameConfig.MIDAJ;

    const estrellaIzquierda = estrella.x;
    const estrellaDerecha = estrella.x + gameConfig.MIDAP;
    const estrellaArriba = estrella.y;
    const estrellaAbajo = estrella.y + gameConfig.MIDAP;

    // Hi ha col·lisió quan no hi ha separació
    return (
      naveIzquierda < estrellaDerecha &&
      naveDerecha > estrellaIzquierda &&
      naveArriba < estrellaAbajo &&
      naveAbajo > estrellaArriba
    );
  },

  // Comprova si una posició està dins d'una zona de piràmide
  isInPyramidZone: (x, y) => {
    const config = gameConfig.getConfig();
    return (
      (x < gameConfig.PHMAX || x > config.width - gameConfig.PHMAX) &&
      (y < gameConfig.PVMAX || y > config.height - gameConfig.PVMAX)
    );
  },

  // Comprova si una posició és a la zona d'un equip
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

  // Comprova si el moviment és vàlid dins l'àrea de joc
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
