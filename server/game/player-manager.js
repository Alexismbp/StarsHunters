// Gestor de jugadors

const gameConfig = require("../config/game-config");

// Variables d'estat
let players = {};
let playerIdCounter = 0;
let puntos = [0, 0]; // Puntuació dels equips

const playerManager = {
  // Getters
  getAllPlayers: () => Object.values(players),
  getPlayer: (id) => players[id],
  getPlayerByWs: (ws) => {
    return Object.values(players).find((player) => player.ws === ws);
  },
  getPlayerCount: () => Object.keys(players).length,
  getPoints: () => [...puntos],

  createPlayer: (ws) => {
    const playerId = playerIdCounter++;

    // Comptem jugadors per equilibrar equips
    let team0Count = 0,
      team1Count = 0;
    Object.values(players).forEach((player) => {
      if (player.team === 0) team0Count++;
      else team1Count++;
    });

    const team = team0Count <= team1Count ? 0 : 1;
    const config = gameConfig.getConfig();

    // Posició inicial segons ID
    let posicionX, posicionY;
    switch (playerId % 4) {
      case 0: // Cantonada superior esquerra
        posicionX = 0;
        posicionY = 0;
        break;
      case 1: // Cantonada inferior dreta
        posicionX = config.width - 8 * gameConfig.ESCALA;
        posicionY = config.height - 8 * gameConfig.ESCALA;
        break;
      case 2: // Cantonada superior dreta
        posicionX = config.width - 8 * gameConfig.ESCALA;
        posicionY = 0;
        break;
      case 3: // Cantonada inferior esquerra
        posicionX = 0;
        posicionY = config.height - 8 * gameConfig.ESCALA;
        break;
    }

    players[playerId] = {
      id: playerId,
      ws: ws,
      x: posicionX,
      y: posicionY,
      team: team,
      puntuacion: 0,
      direction: null,
    };

    return players[playerId];
  },

  removePlayer: (id) => {
    if (players[id]) {
      delete players[id];
      return true;
    }
    return false;
  },

  resetPlayers: () => {
    const config = gameConfig.getConfig();

    Object.values(players).forEach((jugador) => {
      jugador.puntuacion = 0;
      jugador.direction = null;

      // Reposicionem segons ID
      switch (parseInt(jugador.id) % 4) {
        case 0: // Cantonada superior esquerra
          jugador.x = 0;
          jugador.y = 0;
          break;
        case 1: // Cantonada inferior dreta
          jugador.x = config.width - 8 * gameConfig.ESCALA;
          jugador.y = config.height - 8 * gameConfig.ESCALA;
          break;
        case 2: // Cantonada superior dreta
          jugador.x = config.width - 8 * gameConfig.ESCALA;
          jugador.y = 0;
          break;
        case 3: // Cantonada inferior esquerra
          jugador.x = 0;
          jugador.y = config.height - 8 * gameConfig.ESCALA;
          break;
      }

      delete jugador.stone;
    });

    puntos = [0, 0];
  },

  updatePlayerDirection: (playerId, direction, angle) => {
    const player = players[playerId];
    if (player) {
      player.direction = direction;
      if (angle !== undefined) {
        player.angle = angle;
      }
      return true;
    }
    return false;
  },

  incrementPlayerScore: (playerId) => {
    const player = players[playerId];
    if (player) {
      if (!player.puntuacion) player.puntuacion = 0;
      player.puntuacion++;
      return player.puntuacion;
    }
    return 0;
  },

  checkWinCondition: (playerId) => {
    const player = players[playerId];
    const config = gameConfig.getConfig();

    return player && player.puntuacion >= config.scoreLimit;
  },
};

module.exports = playerManager;
