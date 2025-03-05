/**
 * Punto de entrada principal para el servidor de StarsHunters
 * Inicia tanto el servidor HTTP como el servidor WebSocket
 */

const httpServer = require("./networking/http-server");
const websocketServer = require("./networking/websocket-server");
const gameConfig = require("./config/game-config");

// Iniciar servidor HTTP en el puerto 8080
httpServer.start(8080);
console.log("Servidor HTTP escuchando en el puerto 8080");

// Iniciar servidor WebSocket en el puerto 8180
websocketServer.start(8180);
console.log("Servidor WebSocket escuchando en el puerto 8180");

console.log("Configuración inicial del juego:", gameConfig.getConfig());
