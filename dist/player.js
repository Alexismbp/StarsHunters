"use strict";
// Importamos las funciones y tipos desde pyramid.ts
import { configurar, dibuixar, setId, detectarColision, // Añadimos la importación de detectarColision
mostrarEfectoRecoleccion, // Importamos también la función de efectos
 } from "./pyramid.js";
// Variables globales
let ws = null;
let playerId = null;
let currentDirection = null;
let moveInterval = null;
let diagonalInterval = null;
let currentAngle = 0; // Nueva variable para mantener el ángulo actual
// Objeto para rastrear qué teclas están actualmente presionadas
const keysPressed = {
    up: false,
    down: false,
    left: false,
    right: false,
};
// Añadimos un conjunto para rastrear las estrellas con las que hemos colisionado
// para evitar enviar múltiples eventos para la misma colisión
const colisionesEstrellas = new Set();
/*************************************************
 * EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
 *************************************************/
///////////////////////////////////////////////////////////
// ALUMNE: Alberto González, Biel Martínez
///////////////////////////////////////////////////////////
// Función para calcular el ángulo según la dirección
function getAngleFromDirection() {
    // Movimiento diagonal
    if (keysPressed.up && keysPressed.right)
        return 45;
    if (keysPressed.down && keysPressed.right)
        return 135;
    if (keysPressed.down && keysPressed.left)
        return 225;
    if (keysPressed.up && keysPressed.left)
        return 315;
    // Movimiento simple
    if (keysPressed.up)
        return 0;
    if (keysPressed.right)
        return 90;
    if (keysPressed.down)
        return 180;
    if (keysPressed.left)
        return 270;
    // Si no hay movimiento, mantener el último ángulo
    return currentAngle;
}
// Calcular la dirección principal basada en las teclas presionadas
function calculateMainDirection() {
    if (keysPressed.up)
        return "up";
    if (keysPressed.down)
        return "down";
    if (keysPressed.left)
        return "left";
    if (keysPressed.right)
        return "right";
    return null;
}
// Calcular dirección secundaria para movimiento diagonal
function calculateSecondaryDirection() {
    if (keysPressed.up && keysPressed.left)
        return "left";
    if (keysPressed.up && keysPressed.right)
        return "right";
    if (keysPressed.down && keysPressed.left)
        return "left";
    if (keysPressed.down && keysPressed.right)
        return "right";
    return null;
}
// Determinar si tenemos movimiento diagonal
function isDiagonalMovement() {
    return ((keysPressed.up && (keysPressed.left || keysPressed.right)) ||
        (keysPressed.down && (keysPressed.left || keysPressed.right)));
}
// Enviar una dirección al servidor
function sendDirection(direction) {
    if (!ws ||
        ws.readyState !== WebSocket.OPEN ||
        playerId === null ||
        !direction) {
        return;
    }
    // Actualizar el ángulo actual según las teclas presionadas
    currentAngle = getAngleFromDirection();
    ws.send(JSON.stringify({
        type: "direccio",
        id: playerId,
        direction: direction,
        angle: currentAngle, // Enviamos el ángulo junto con la dirección
    }));
}
// Actualiza el movimiento basado en el estado actual de las teclas
function updateMovement() {
    if (!ws || ws.readyState !== WebSocket.OPEN || playerId === null) {
        return;
    }
    // Detener los intervalos existentes
    if (moveInterval) {
        clearInterval(moveInterval);
        moveInterval = null;
    }
    if (diagonalInterval) {
        clearInterval(diagonalInterval);
        diagonalInterval = null;
    }
    const mainDirection = calculateMainDirection();
    currentDirection = mainDirection;
    // Si no hay dirección, salir
    if (!mainDirection)
        return;
    // Comprobar si es un movimiento diagonal
    if (isDiagonalMovement()) {
        const secondaryDirection = calculateSecondaryDirection();
        // Implementar movimiento diagonal alternando entre direcciones
        moveInterval = window.setInterval(() => {
            sendDirection(mainDirection);
        }, 100);
        diagonalInterval = window.setInterval(() => {
            sendDirection(secondaryDirection);
        }, 100);
    }
    else {
        // Movimiento normal
        moveInterval = window.setInterval(() => {
            sendDirection(mainDirection);
        }, 100);
    }
}
// Añadimos manejador para detener el movimiento cuando se suelta la tecla
function aturarMoviment(ev) {
    if (!ws || ws.readyState !== WebSocket.OPEN || playerId === null) {
        return;
    }
    // Actualizar el estado de las teclas cuando se sueltan
    switch (ev.key) {
        case "ArrowUp":
        case "w":
        case "W":
            keysPressed.up = false;
            break;
        case "ArrowDown":
        case "s":
        case "S":
            keysPressed.down = false;
            break;
        case "ArrowLeft":
        case "a":
        case "A":
            keysPressed.left = false;
            break;
        case "ArrowRight":
        case "d":
        case "D":
            keysPressed.right = false;
            break;
    }
    // Recalcular la dirección y actualizar el movimiento
    updateMovement();
}
// Gestor de l'esdeveniment per les tecles
function direccio(ev) {
    if (!ws || ws.readyState !== WebSocket.OPEN || playerId === null) {
        return;
    }
    // Evitar repetición si la tecla ya está presionada
    if (ev.repeat)
        return;
    // Para teclas de acción inmediata (espacio, enter)
    // Ya no necesitamos el mensaje "agafar" para recoger estrellas manualmente
    // Las estrellas se recogerán automáticamente por colisión
    // Actualizar el estado de las teclas cuando se presionan
    switch (ev.key) {
        case "ArrowUp":
        case "w":
        case "W":
            keysPressed.up = true;
            break;
        case "ArrowDown":
        case "s":
        case "S":
            keysPressed.down = true;
            break;
        case "ArrowLeft":
        case "a":
        case "A":
            keysPressed.left = true;
            break;
        case "ArrowRight":
        case "d":
        case "D":
            keysPressed.right = true;
            break;
        default:
            return; // Si no es una tecla relevante, no hacer nada más
    }
    // Recalcular la dirección y actualizar el movimiento
    updateMovement();
}
// Establir la connexió amb el servidor en el port 8180
function init() {
    // Inicialitzar la connexió WebSocket
    console.log("🚀 Inicialitzant connexió WebSocket...");
    ws = new WebSocket("ws://localhost:8180");
    ws.onopen = function () {
        // Enviar missatge de nou jugador
        console.log("✅ Connexió establerta amb el servidor");
        console.log("📤 Enviant petició de nou jugador");
        if (ws) {
            ws.send(JSON.stringify({ type: "player" }));
        }
    };
    ws.onclose = function () {
        // Tancar la connexió
        console.log("❌ Connexió tancada");
        alert("Connexió tancada. Tornant a la pàgina principal.");
        window.location.href = "index.html";
    };
    ws.onerror = function (error) {
        // Mostrar error i tancar la connexió
        console.log("❌ Error en la connexió:", error);
        alert("Error en la connexió");
        window.location.href = "index.html";
    };
    ws.onmessage = function (event) {
        // Processar missatges rebuts
        try {
            const message = JSON.parse(event.data);
            console.log("📩 Missatge rebut:", message);
            switch (message.type) {
                // Processar missatges segons el tipus
                case "connectat":
                    const connectedMsg = message;
                    playerId = connectedMsg.id;
                    // Establecer el ID en pyramid.ts
                    setId(playerId);
                    console.log("✅ Connectat com a jugador", playerId);
                    // Aplicar configuración inicial
                    if (connectedMsg.config) {
                        console.log("⚙️ Configuració inicial rebuda:", connectedMsg.config);
                        configurar(connectedMsg.config);
                        // Mostrar el límite de puntuación si existe en la interfaz
                        const scoreLimitInput = document.getElementById("scoreLimit");
                        if (scoreLimitInput && connectedMsg.config.scoreLimit) {
                            scoreLimitInput.value = connectedMsg.config.scoreLimit.toString();
                        }
                    }
                    break;
                case "config":
                    // Actualitzar la configuració del joc
                    const configMsg = message;
                    if (!configMsg.data || typeof configMsg.data !== "object") {
                        console.error("❌ Dades de configuració invàlides");
                        return;
                    }
                    console.log("⚙️ Nova configuració rebuda:", configMsg.data);
                    configurar(configMsg.data);
                    // Mostrar el límite de puntuación si existe en la interfaz
                    const scoreLimitInput = document.getElementById("scoreLimit");
                    if (scoreLimitInput && configMsg.data.scoreLimit) {
                        scoreLimitInput.value = configMsg.data.scoreLimit.toString();
                    }
                    break;
                case "dibuixar":
                    const drawMsg = message;
                    console.log("🎨 Actualitzant estat del joc:", {
                        jugadors: drawMsg.jugadors?.length || 0,
                        pedres: drawMsg.pedres?.length || 0,
                    });
                    // Ahora dibuixar sólo recibe dos parámetros: jugadores y piedras
                    dibuixar(drawMsg.jugadors || [], drawMsg.pedres || []);
                    // Comprobar si hay colisiones entre la nave del jugador actual y alguna estrella
                    if (playerId !== null) {
                        const jugadorActual = drawMsg.jugadors?.find((j) => j.id === playerId);
                        if (jugadorActual) {
                            drawMsg.pedres?.forEach((estrella) => {
                                if (estrella.id !== undefined &&
                                    detectarColision(jugadorActual, estrella)) {
                                    // Solo enviar un mensaje de colisión si no hemos colisionado ya con esta estrella
                                    if (!colisionesEstrellas.has(estrella.id)) {
                                        console.log(`Colisión detectada con estrella ${estrella.id}`);
                                        // Almacenar esta colisión para evitar duplicados
                                        colisionesEstrellas.add(estrella.id);
                                        // Enviar mensaje de colisión al servidor
                                        // El servidor debe eliminar esta estrella y crear una nueva
                                        ws.send(JSON.stringify({
                                            type: "starCollision",
                                            jugadorId: playerId,
                                            estrellaId: estrella.id,
                                        }));
                                        // Mostrar efecto visual de recolección
                                        mostrarEfectoRecoleccion(estrella.x, estrella.y);
                                    }
                                }
                            });
                        }
                    }
                    // Limpiamos el conjunto de colisiones para las estrellas que ya no existen
                    // Esto evita que el conjunto crezca indefinidamente
                    if (drawMsg.pedres) {
                        const estrellasActualesIds = new Set();
                        drawMsg.pedres.forEach((p) => {
                            if (p.id !== undefined) {
                                estrellasActualesIds.add(p.id);
                            }
                        });
                        // Eliminar IDs de estrellas que ya no existen en el juego
                        colisionesEstrellas.forEach((id) => {
                            if (!estrellasActualesIds.has(id)) {
                                colisionesEstrellas.delete(id);
                            }
                        });
                    }
                    break;
                case "ganador":
                    const winnerMsg = message;
                    console.log(`🏆 El jugador ${winnerMsg.id} ha ganado el juego!`);
                    break;
                case "engegar":
                    console.log("🎮 Joc iniciat");
                    break;
                case "aturar":
                    console.log("⏹️ Joc aturat");
                    break;
                case "missatge":
                    const msgMsg = message;
                    console.log("💬 Missatge del servidor:", msgMsg.text);
                    break;
                case "colision":
                    // Si hi ha col·lisió, aturar el moviment
                    if (moveInterval) {
                        clearInterval(moveInterval);
                        moveInterval = null;
                        currentDirection = null;
                        // Reiniciar estado de teclas al detectar colisión
                        Object.keys(keysPressed).forEach((key) => {
                            keysPressed[key] = false;
                        });
                    }
                    break;
                // Nuevo tipo de mensaje para colisiones con estrellas
                case "starCollision":
                    const starMsg = message;
                    console.log(`⭐ Jugador ${starMsg.jugadorId} ha recogido una estrella. Nueva puntuación: ${starMsg.nuevaPuntuacion}`);
                    // Si somos nosotros, mostrar un mensaje más destacado
                    if (playerId === starMsg.jugadorId) {
                        console.log("%c¡Has recogido una estrella! +1 punto", "color: yellow; background-color: black; font-size: 16px; padding: 5px;");
                    }
                    // Buscar la estrella con la que colisionamos para mostrar un efecto aunque no seamos nosotros
                    // Esto es importante para visualizar correctamente cuando otros jugadores recogen estrellas
                    const estrella = document.getElementById(`estrella-${starMsg.estrellaId}`);
                    if (estrella) {
                        // Extraer las coordenadas para el efecto
                        const x = parseFloat(estrella.getAttribute("x") || "0");
                        const y = parseFloat(estrella.getAttribute("y") || "0");
                        // Mostrar animación de recolección
                        mostrarEfectoRecoleccion(x, y);
                    }
                    break;
                default:
                    console.log("❓ Missatge no processat:", message);
            }
        }
        catch (error) {
            console.error("Error al procesar mensaje:", error);
        }
    };
    // Afegir els gestors d'esdeveniments per les tecles
    document.addEventListener("keydown", direccio);
    document.addEventListener("keyup", aturarMoviment);
    console.log("✅ Event listeners de teclat afegits");
}
/***********************************************
 * FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
 ***********************************************/
window.onload = init;
