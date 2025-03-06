// Servidor WebSocket per a comunicació en temps real

const WebSocket = require("ws");
const gameConfig = require("../config/game-config");
const playerManager = require("../game/player-manager");
const starManager = require("../game/star-manager");
const gameManager = require("../game/game-manager");

let wss = null;
let adminWs = null;

// Configuració dels callbacks del gestor d'estrelles
starManager.onStarDisappear = (starId) => {
  broadcastToAll({
    type: "starDisappear",
    estrellaId: starId,
  });
};

starManager.onStarsUpdated = () => {
  sendGameState();
};

// Configuració dels callbacks del gestor del joc
gameManager.setCallbacks({
  onGameUpdate: sendGameState,

  onPlayerWin: (playerId, score) => {
    broadcastToAll({
      type: "ganador",
      id: playerId,
      puntuacion: score,
    });
  },

  onTimeUpdate: (remainingTime) => {
    broadcastToAll({
      type: "timeUpdate",
      remainingTime: remainingTime,
    });
  },

  onGameEnd: (result) => {
    if (result && result.empate) {
      broadcastToAll({
        type: "timeUp",
        empate: true,
        maximaPuntuacion: result.maximaPuntuacion,
      });
    }
  },
});

// Manejador per quan un client envia un missatge
gameManager.onStarCollision = (playerId, starId, newScore, newStar) => {
  broadcastToAll({
    type: "starCollision",
    jugadorId: playerId,
    estrellaId: starId,
    nuevaPuntuacion: newScore,
    nuevaEstrella: newStar,
  });
};

// Envia missatges a tots els clients connectats
function broadcastToAll(message) {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Envia l'estat actual del joc a tots els clients
function sendGameState() {
  broadcastToAll({
    type: "dibuixar",
    jugadors: playerManager.getAllPlayers(),
    pedres: starManager.getAllStars(),
    punts: playerManager.getPoints(),
  });
}

// Processa els missatges dels clients
function processMessage(ws, message) {
  try {
    const data = JSON.parse(message);
    console.log("📩 Mensaje recibido:", data);

    switch (data.type) {
      case "admin":
        handleAdminRequest(ws);
        break;
      case "player":
        handlePlayerRequest(ws);
        break;
      case "config":
        handleConfigRequest(ws, data);
        break;
      case "start":
        handleStartRequest(ws);
        break;
      case "stop":
        handleStopRequest(ws);
        break;
      case "direccio":
        handleDirectionUpdate(ws, data);
        break;
      case "agafar":
        handlePickupRequest(ws, data);
        break;
      case "starCollision":
        handleStarCollision(data);
        break;
      default:
        console.log("❌ Tipo de mensaje desconocido:", data.type);
    }
  } catch (error) {
    console.error("❌ Error procesando mensaje:", error);
  }
}

// Gestiona les sol·licituds d'administrador
function handleAdminRequest(ws) {
  if (adminWs !== null) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Ya existe un administrador",
      })
    );
    return;
  }

  adminWs = ws;
  console.log("Administrador creado");

  ws.send(
    JSON.stringify({
      type: "config",
      data: gameConfig.getConfig(),
    })
  );
}

// Gestiona les sol·licituds de nou jugador
function handlePlayerRequest(ws) {
  if (gameManager.isGameRunning()) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "El juego ya está en marcha",
      })
    );
    return;
  }

  const player = playerManager.createPlayer(ws);
  console.log(`Nuevo jugador conectado con ID: ${player.id}`);

  ws.send(
    JSON.stringify({
      type: "connectat",
      id: player.id,
      config: gameConfig.getConfig(),
    })
  );

  sendGameState();
}

// Gestiona les sol·licituds de canvi de configuració
function handleConfigRequest(ws, data) {
  if (ws !== adminWs) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "No tienes permisos de administrador",
      })
    );
    return;
  }

  if (gameManager.isGameRunning()) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "No se puede configurar mientras el juego está en marcha",
      })
    );
    return;
  }

  const success = gameConfig.updateConfig(data.data);
  if (!success) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Valores de configuración no válidos",
      })
    );
    return;
  }

  playerManager.resetPlayers();

  broadcastToAll({
    type: "config",
    data: gameConfig.getConfig(),
  });

  sendGameState();
}

// Gestiona les sol·licituds d'inici de joc
function handleStartRequest(ws) {
  if (ws !== adminWs) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "No tienes permisos de administrador",
      })
    );
    return;
  }

  if (gameManager.isGameRunning()) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "El juego ya está en marcha",
      })
    );
    return;
  }

  gameManager.startGame();

  broadcastToAll({ type: "engegar" });
}

// Gestiona les sol·licituds d'aturada de joc
function handleStopRequest(ws) {
  if (ws !== adminWs) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "No tienes permisos de administrador",
      })
    );
    return;
  }

  if (!gameManager.isGameRunning()) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "El juego ya está detenido",
      })
    );
    return;
  }

  gameManager.stopGame();

  broadcastToAll({ type: "aturar" });
}

// Actualitza la direcció d'un jugador
function handleDirectionUpdate(ws, data) {
  if (!gameManager.isGameRunning()) return;

  playerManager.updatePlayerDirection(data.id, data.direction, data.angle);
}

// Gestiona la sol·licitud de recollir/deixar pedra
function handlePickupRequest(ws, data) {
  console.log("Función 'agafar' no implementada en esta versión");
}

// Gestiona la col·lisió amb una estrella
function handleStarCollision(data) {
  gameManager.handleStarCollision(data.jugadorId, data.estrellaId);
}

// Gestiona la desconnexió d'un client
function handleClientDisconnect(ws) {
  const player = playerManager.getPlayerByWs(ws);
  if (player) {
    console.log(`Cliente desconectado (ID: ${player.id})`);
    playerManager.removePlayer(player.id);
    sendGameState();
  }

  if (ws === adminWs) {
    console.log("Administrador desconectado");
    adminWs = null;
  }
}

module.exports = {
  start: (port) => {
    wss = new WebSocket.Server({ port });

    wss.on("connection", function connection(ws) {
      console.log("Nuevo cliente conectado");

      ws.send(
        JSON.stringify({
          type: "config",
          data: gameConfig.getConfig(),
        })
      );

      ws.on("message", function incoming(message) {
        processMessage(ws, message);
      });

      ws.on("close", function close() {
        handleClientDisconnect(ws);
      });

      ws.on("error", function error(err) {
        console.error("Error en la conexión WebSocket:", err);
      });
    });

    return wss;
  },
};
