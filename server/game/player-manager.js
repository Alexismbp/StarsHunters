/**
 * Gestión de jugadores
 */

const gameConfig = require("../config/game-config");

// Variables de estado
let players = {};
let playerIdCounter = 0;
let puntos = [0, 0]; // Puntuación de cada equipo

const playerManager = {
  // Getters
  getAllPlayers: () => Object.values(players),
  getPlayer: (id) => players[id],
  getPlayerByWs: (ws) => {
    return Object.values(players).find((player) => player.ws === ws);
  },
  getPlayerCount: () => Object.keys(players).length,
  getPoints: () => [...puntos],

  // Crear un nuevo jugador
  createPlayer: (ws) => {
    const playerId = playerIdCounter++;

    // Contar jugadores de cada equipo para equilibrar
    let team0Count = 0,
      team1Count = 0;
    Object.values(players).forEach((player) => {
      if (player.team === 0) team0Count++;
      else team1Count++;
    });

    // Asignar equipo basado en el balance actual
    const team = team0Count <= team1Count ? 0 : 1;
    const config = gameConfig.getConfig();

    // Determinar posición inicial según el ID
    let posicionX, posicionY;
    switch (playerId % 4) {
      case 0: // Esquina superior izquierda
        posicionX = 0;
        posicionY = 0;
        break;
      case 1: // Esquina inferior derecha
        posicionX = config.width - 8 * gameConfig.ESCALA;
        posicionY = config.height - 8 * gameConfig.ESCALA;
        break;
      case 2: // Esquina superior derecha
        posicionX = config.width - 8 * gameConfig.ESCALA;
        posicionY = 0;
        break;
      case 3: // Esquina inferior izquierda
        posicionX = 0;
        posicionY = config.height - 8 * gameConfig.ESCALA;
        break;
    }

    // Crear el jugador
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

  // Eliminar un jugador
  removePlayer: (id) => {
    if (players[id]) {
      delete players[id];
      return true;
    }
    return false;
  },

  // Resetear todos los jugadores
  resetPlayers: () => {
    const config = gameConfig.getConfig();

    Object.values(players).forEach((jugador) => {
      jugador.puntuacion = 0;
      jugador.direction = null;

      // Reposicionar según ID
      switch (parseInt(jugador.id) % 4) {
        case 0: // Esquina superior izquierda
          jugador.x = 0;
          jugador.y = 0;
          break;
        case 1: // Esquina inferior derecha
          jugador.x = config.width - 8 * gameConfig.ESCALA;
          jugador.y = config.height - 8 * gameConfig.ESCALA;
          break;
        case 2: // Esquina superior derecha
          jugador.x = config.width - 8 * gameConfig.ESCALA;
          jugador.y = 0;
          break;
        case 3: // Esquina inferior izquierda
          jugador.x = 0;
          jugador.y = config.height - 8 * gameConfig.ESCALA;
          break;
      }

      delete jugador.stone;
    });

    // Resetear puntuaciones
    puntos = [0, 0];
  },

  // Actualizar dirección de un jugador
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

  // Incrementar puntuación de un jugador
  incrementPlayerScore: (playerId) => {
    const player = players[playerId];
    if (player) {
      if (!player.puntuacion) player.puntuacion = 0;
      player.puntuacion++;
      return player.puntuacion;
    }
    return 0;
  },

  // Verificar si un jugador ha ganado según la config
  checkWinCondition: (playerId) => {
    const player = players[playerId];
    const config = gameConfig.getConfig();

    return player && player.puntuacion >= config.scoreLimit;
  },
};

module.exports = playerManager;
