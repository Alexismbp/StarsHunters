// Punt d'entrada principal pel servidor de StarsHunters

const http = require("http");
const httpServer = require("./networking/http-server");
const websocketServer = require("./networking/websocket-server");
const gameConfig = require("./config/game-config");

// Usar el puerto proporcionado por Render o uno por defecto
const PORT = process.env.PORT || 8080;

// Crear servidor HTTP
const server = httpServer.start(PORT);
console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);

// Iniciar servidor WebSocket usando el mismo servidor HTTP
websocketServer.start(server);
console.log(`Servidor WebSocket integrado en el puerto ${PORT}`);

// Mostra la configuració inicial del joc
console.log("Configuración inicial del juego:", gameConfig.getConfig());
