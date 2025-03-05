/**
 * Servidor WebSocket para comunicación en tiempo real
 */

const WebSocket = require("ws");
const gameConfig = require("../config/game-config");
const playerManager = require("../game/player-manager");
const starManager = require("../game/star-manager");
const gameManager = require("../game/game-manager");

let wss = null;
let adminWs = null;

// Configurar los callbacks del gestor de estrellas
starManager.onStarDisappear = (starId) => {
  broadcastToAll({
    type: "starDisappear",
    estrellaId: starId,
  });
};

starManager.onStarsUpdated = () => {
  sendGameState();
};

// Configurar los callbacks del gestor del juego
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

// Manejador para cuando un cliente envía un mensaje
gameManager.onStarCollision = (playerId, starId, newScore, newStar) => {
  broadcastToAll({
    type: "starCollision",
    jugadorId: playerId,
    estrellaId: starId,
    nuevaPuntuacion: newScore,
    nuevaEstrella: newStar,
  });
};

// Función para enviar mensaje a todos los clientes conectados
function broadcastToAll(message) {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Función para enviar el estado actual del juego
function sendGameState() {
  broadcastToAll({
    type: "dibuixar",
    jugadors: playerManager.getAllPlayers(),
    pedres: starManager.getAllStars(),
    punts: playerManager.getPoints(),
  });
}

// Procesa los mensajes recibidos de los clientes
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

// Función para manejar la solicitud de administrador
function handleAdminRequest(ws) {
  // Comprobar si ya existe un administrador
  if (adminWs !== null) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Ya existe un administrador",
      })
    );
    return;
  }

  // Establecer como administrador
  adminWs = ws;
  console.log("Administrador creado");

  // Enviar configuración actual
  ws.send(
    JSON.stringify({
      type: "config",
      data: gameConfig.getConfig(),
    })
  );
}

// Función para manejar la solicitud de jugador
function handlePlayerRequest(ws) {
  // Verificar si el juego está en marcha
  if (gameManager.isGameRunning()) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "El juego ya está en marcha",
      })
    );
    return;
  }

  // Crear jugador
  const player = playerManager.createPlayer(ws);
  console.log(`Nuevo jugador conectado con ID: ${player.id}`);

  // Enviar identificador y configuración
  ws.send(
    JSON.stringify({
      type: "connectat",
      id: player.id,
      config: gameConfig.getConfig(),
    })
  );

  // Enviar estado actual del juego
  sendGameState();
}

// Función para manejar la solicitud de configuración
function handleConfigRequest(ws, data) {
  // Verificar que es el administrador
  if (ws !== adminWs) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "No tienes permisos de administrador",
      })
    );
    return;
  }

  // Verificar que el juego no está en marcha
  if (gameManager.isGameRunning()) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "No se puede configurar mientras el juego está en marcha",
      })
    );
    return;
  }

  // Actualizar configuración
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

  // Reiniciar jugadores
  playerManager.resetPlayers();

  // Enviar nueva configuración a todos los clientes
  broadcastToAll({
    type: "config",
    data: gameConfig.getConfig(),
  });

  sendGameState();
}

// Función para manejar la solicitud de inicio de juego
function handleStartRequest(ws) {
  // Verificar que es el administrador
  if (ws !== adminWs) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "No tienes permisos de administrador",
      })
    );
    return;
  }

  // Iniciar el juego
  if (gameManager.isGameRunning()) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "El juego ya está en marcha",
      })
    );
    return;
  }

  // Iniciar el juego
  gameManager.startGame();

  // Notificar a todos los clientes
  broadcastToAll({ type: "engegar" });
}

// Función para manejar la solicitud de detener el juego
function handleStopRequest(ws) {
  // Verificar que es el administrador
  if (ws !== adminWs) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "No tienes permisos de administrador",
      })
    );
    return;
  }

  // Detener el juego
  if (!gameManager.isGameRunning()) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "El juego ya está detenido",
      })
    );
    return;
  }

  // Detener el juego
  gameManager.stopGame();

  // Notificar a todos los clientes
  broadcastToAll({ type: "aturar" });
}

// Función para manejar la actualización de dirección
function handleDirectionUpdate(ws, data) {
  // Verificar si el juego está en marcha
  if (!gameManager.isGameRunning()) return;

  // Actualizar dirección del jugador
  playerManager.updatePlayerDirection(data.id, data.direction, data.angle);
}

// Función para manejar la solicitud de recoger/dejar piedra
function handlePickupRequest(ws, data) {
  // No implementado en esta versión ya que el juego de estrellas no usa ese mecanismo
  console.log("Función 'agafar' no implementada en esta versión");
}

// Función para manejar la colisión con una estrella
function handleStarCollision(data) {
  gameManager.handleStarCollision(data.jugadorId, data.estrellaId);
}

// Función para manejar el cierre de conexión de un cliente
function handleClientDisconnect(ws) {
  // Comprobar si el cliente es un jugador
  const player = playerManager.getPlayerByWs(ws);
  if (player) {
    console.log(`Cliente desconectado (ID: ${player.id})`);
    playerManager.removePlayer(player.id);
    sendGameState();
  }

  // Comprobar si el cliente es el administrador
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

      // Enviar configuración inicial
      ws.send(
        JSON.stringify({
          type: "config",
          data: gameConfig.getConfig(),
        })
      );

      // Gestionar mensajes entrantes
      ws.on("message", function incoming(message) {
        processMessage(ws, message);
      });

      // Gestionar desconexiones
      ws.on("close", function close() {
        handleClientDisconnect(ws);
      });

      // Gestionar errores
      ws.on("error", function error(err) {
        console.error("Error en la conexión WebSocket:", err);
      });
    });

    return wss;
  },
};
