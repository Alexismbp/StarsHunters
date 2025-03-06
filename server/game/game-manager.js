/**
 * Gestor principal del joc que controla l'estat, inicialització i actualització
 */

const gameConfig = require("../config/game-config");
const playerManager = require("./player-manager");
const starManager = require("./star-manager");
const collisionDetector = require("./collision.js");

// Variables d'estat del joc
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
  isGameRunning: () => gameRunning,
  getRemainingTime: () => remainingTime,

  setCallbacks: (callbacks) => {
    if (callbacks.onGameUpdate) onGameUpdate = callbacks.onGameUpdate;
    if (callbacks.onPlayerWin) onPlayerWin = callbacks.onPlayerWin;
    if (callbacks.onTimeUpdate) onTimeUpdate = callbacks.onTimeUpdate;
    if (callbacks.onGameEnd) onGameEnd = callbacks.onGameEnd;
  },

  startGame: () => {
    if (gameRunning) return false;

    playerManager.resetPlayers();
    starManager.initializeStars();
    gameRunning = true;

    const config = gameConfig.getConfig();
    if (config.timeLimit && config.timeLimit > 0) {
      remainingTime = config.timeLimit;

      if (onTimeUpdate) onTimeUpdate(remainingTime);

      gameTimer = setInterval(() => {
        remainingTime--;

        if (remainingTime <= 0) {
          clearInterval(gameTimer);
          gameTimer = null;

          if (timeUpdateInterval) {
            clearInterval(timeUpdateInterval);
            timeUpdateInterval = null;
          }

          gameManager.determineResultByTime();
        }
      }, 1000);

      timeUpdateInterval = setInterval(() => {
        if (onTimeUpdate) onTimeUpdate(remainingTime);
      }, 5000);
    }

    gameInterval = setInterval(gameManager.update, gameConfig.TEMPS);

    return true;
  },

  stopGame: () => {
    if (!gameRunning) return false;

    gameRunning = false;

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

  // Bucle principal del joc
  update: () => {
    if (!gameRunning) return;

    const players = playerManager.getAllPlayers();
    const stars = starManager.getAllStars();

    players.forEach((player) => {
      if (!player.direction) return;

      let newX = player.x;
      let newY = player.y;

      // Factor per moviment diagonal
      const diagonalFactor = 0.7071;

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

      if (collisionDetector.isValidMove(newX, newY)) {
        player.x = newX;
        player.y = newY;

        if (player.stone) {
          player.stone.x = newX;
          player.stone.y = newY;
        }
      }

      stars.forEach((estrella) => {
        if (collisionDetector.detectPlayerStarCollision(player, estrella)) {
          gameManager.handleStarCollision(player.id, estrella.id);
        }
      });
    });

    starManager.ensureStarCount();

    if (onGameUpdate) onGameUpdate();
  },

  // Gestiona col·lisió entre jugador i estrella
  handleStarCollision: (playerId, starId) => {
    const player = playerManager.getPlayer(playerId);
    if (!player) return false;

    const starInfo = starManager.removeStar(starId);
    if (!starInfo) return false;

    const newScore = playerManager.incrementPlayerScore(playerId);

    if (typeof gameManager.onStarCollision === "function") {
      gameManager.onStarCollision(playerId, starId, newScore, starInfo.newStar);
    }

    if (playerManager.checkWinCondition(playerId)) {
      if (onPlayerWin) onPlayerWin(playerId);
      gameManager.stopGame();
    }

    return true;
  },

  // Determina el resultat quan s'esgota el temps
  determineResultByTime: () => {
    console.log("⏰ Temps esgotat");

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

    if (tie) {
      console.log("🏆 Joc empatat amb puntuació: " + maxScore);
      if (onGameEnd) onGameEnd({ empate: true, maximaPuntuacion: maxScore });
    } else if (bestPlayer) {
      console.log(
        `🏆 Guanyador: Jugador ${bestPlayer.id} amb ${maxScore} punts`
      );
      if (onPlayerWin) onPlayerWin(bestPlayer.id, maxScore);
    }

    gameManager.stopGame();
  },
};

module.exports = gameManager;
