/**
 * Gestor principal del juego
 * Controla el estado del juego, iniciando/deteniendo y actualizando el estado
 */

const gameConfig = require("../config/game-config");
const playerManager = require("./player-manager");
const starManager = require("./star-manager");
const collisionDetector = require("./collision.js");

// Variables de estado del juego
let gameRunning = false;
let gameInterval = null;
let gameTimer = null;
let remainingTime = 0;
let timeUpdateInterval = null;

// Callbacks
let onGameUpdate = null;
let onPlayerWin = null;
let onTimeUpdate = null;
let onGameEnd = null;

const gameManager = {
  // Getters para el estado
  isGameRunning: () => gameRunning,
  getRemainingTime: () => remainingTime,

  // Configurar callbacks
  setCallbacks: (callbacks) => {
    if (callbacks.onGameUpdate) onGameUpdate = callbacks.onGameUpdate;
    if (callbacks.onPlayerWin) onPlayerWin = callbacks.onPlayerWin;
    if (callbacks.onTimeUpdate) onTimeUpdate = callbacks.onTimeUpdate;
    if (callbacks.onGameEnd) onGameEnd = callbacks.onGameEnd;
  },

  // Iniciar el juego
  startGame: () => {
    if (gameRunning) return false;

    // Reiniciar el estado del juego
    playerManager.resetPlayers();
    starManager.initializeStars();
    gameRunning = true;

    // Configurar temporizador si hay límite de tiempo
    const config = gameConfig.getConfig();
    if (config.timeLimit && config.timeLimit > 0) {
      remainingTime = config.timeLimit;

      // Notificar tiempo inicial
      if (onTimeUpdate) onTimeUpdate(remainingTime);

      // Iniciar temporizador
      gameTimer = setInterval(() => {
        remainingTime--;

        // Tiempo agotado
        if (remainingTime <= 0) {
          clearInterval(gameTimer);
          gameTimer = null;

          if (timeUpdateInterval) {
            clearInterval(timeUpdateInterval);
            timeUpdateInterval = null;
          }

          // Determinar resultado por tiempo
          gameManager.determineResultByTime();
        }
      }, 1000);

      // Actualizar tiempo periódicamente
      timeUpdateInterval = setInterval(() => {
        if (onTimeUpdate) onTimeUpdate(remainingTime);
      }, 5000);
    }

    // Iniciar bucle principal del juego
    gameInterval = setInterval(gameManager.update, gameConfig.TEMPS);

    return true;
  },

  // Detener el juego
  stopGame: () => {
    if (!gameRunning) return false;

    gameRunning = false;

    // Limpiar temporizadores
    if (gameInterval) {
      clearInterval(gameInterval);
      gameInterval = null;
    }

    if (gameTimer) {
      clearInterval(gameTimer);
      gameTimer = null;
    }

    if (timeUpdateInterval) {
      clearInterval(timeUpdateInterval);
      timeUpdateInterval = null;
    }

    starManager.clearTimers();

    if (onGameEnd) onGameEnd();

    return true;
  },

  // Actualización del juego (bucle principal)
  update: () => {
    if (!gameRunning) return;

    // Actualizar posiciones de jugadores
    const players = playerManager.getAllPlayers();
    const stars = starManager.getAllStars();

    // Mover cada jugador según su dirección
    players.forEach((player) => {
      if (!player.direction) return;

      let newX = player.x;
      let newY = player.y;

      // Factor para movimiento diagonal
      const diagonalFactor = 0.7071;

      // Calcular nueva posición según la dirección
      switch (player.direction) {
        case "up":
          newY -= gameConfig.INCHV;
          break;
        case "down":
          newY += gameConfig.INCHV;
          break;
        case "left":
          newX -= gameConfig.INCHV;
          break;
        case "right":
          newX += gameConfig.INCHV;
          break;
        case "up-left":
          newX -= gameConfig.INCHV * diagonalFactor;
          newY -= gameConfig.INCHV * diagonalFactor;
          break;
        case "up-right":
          newX += gameConfig.INCHV * diagonalFactor;
          newY -= gameConfig.INCHV * diagonalFactor;
          break;
        case "down-left":
          newX -= gameConfig.INCHV * diagonalFactor;
          newY += gameConfig.INCHV * diagonalFactor;
          break;
        case "down-right":
          newX += gameConfig.INCHV * diagonalFactor;
          newY += gameConfig.INCHV * diagonalFactor;
          break;
      }

      // Verificar que el movimiento es válido
      if (collisionDetector.isValidMove(newX, newY)) {
        player.x = newX;
        player.y = newY;

        // Actualizar posición de la piedra si la lleva
        if (player.stone) {
          player.stone.x = newX;
          player.stone.y = newY;
        }
      }

      // Comprobar colisiones con estrellas
      stars.forEach((estrella) => {
        if (collisionDetector.detectPlayerStarCollision(player, estrella)) {
          gameManager.handleStarCollision(player.id, estrella.id);
        }
      });
    });

    // Asegurar que siempre haya suficientes estrellas
    starManager.ensureStarCount();

    // Notificar actualización del juego
    if (onGameUpdate) onGameUpdate();
  },

  // Manejar colisión entre jugador y estrella
  handleStarCollision: (playerId, starId) => {
    const player = playerManager.getPlayer(playerId);
    if (!player) return false;

    const starInfo = starManager.removeStar(starId);
    if (!starInfo) return false;

    // Incrementar puntuación
    const newScore = playerManager.incrementPlayerScore(playerId);

    // Notificar colisión
    if (typeof gameManager.onStarCollision === "function") {
      gameManager.onStarCollision(playerId, starId, newScore, starInfo.newStar);
    }

    // Comprobar condición de victoria
    if (playerManager.checkWinCondition(playerId)) {
      if (onPlayerWin) onPlayerWin(playerId);
      gameManager.stopGame();
    }

    return true;
  },

  // Determinar resultado cuando se agota el tiempo
  determineResultByTime: () => {
    console.log("⏰ Tiempo agotado");

    // Encontrar al jugador con más puntos
    const players = playerManager.getAllPlayers();
    let bestPlayer = null;
    let maxScore = -1;
    let tie = false;

    players.forEach((player) => {
      if (player.puntuacion > maxScore) {
        bestPlayer = player;
        maxScore = player.puntuacion;
        tie = false;
      } else if (player.puntuacion === maxScore) {
        tie = true;
      }
    });

    // Notificar resultado (empate o ganador)
    if (tie) {
      console.log("🏆 Juego empatado con puntuación: " + maxScore);
      if (onGameEnd) onGameEnd({ empate: true, maximaPuntuacion: maxScore });
    } else if (bestPlayer) {
      console.log(
        `🏆 Ganador: Jugador ${bestPlayer.id} con ${maxScore} puntos`
      );
      if (onPlayerWin) onPlayerWin(bestPlayer.id, maxScore);
    }

    // Detener el juego en cualquier caso
    gameManager.stopGame();
  },
};

module.exports = gameManager;
