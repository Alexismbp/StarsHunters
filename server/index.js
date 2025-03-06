// Punt d'entrada principal pel servidor de StarsHunters

const httpServer = require("./networking/http-server");
const websocketServer = require("./networking/websocket-server");
const gameConfig = require("./config/game-config");

// Iniciar servidor HTTP al port 8080
httpServer.start(8080);
console.log("Servidor HTTP escuchando en el puerto 8080");

// Iniciar servidor WebSocket al port 8180
websocketServer.start(8180);
console.log("Servidor WebSocket escuchando en el puerto 8180");

// Mostra la configuració inicial del joc
console.log("Configuración inicial del juego:", gameConfig.getConfig());
