/**
 * Script para iniciar fácilmente el servidor
 * Ejecutar con: node start-server.js
 */

// Importar el archivo principal
require("./server/index");

// NO inicies otro servidor aquí, solo muestra información
console.log("StarHunters Server");
console.log("=================");
console.log("Servidor inicializado en:");
console.log(
  `- HTTP y WebSocket: ${
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${process.env.PORT || 8080}`
  }`
);
console.log("\nPara detener el servidor, presiona Ctrl+C");
