"use strict";
import { configurar, dibuixar, setId, detectarColision, mostrarEfectoRecoleccion, } from "./pyramid.js";
// Variables globals
let ws = null;
let playerId = null;
let currentDirection = null;
let currentAngle = 0;
// Objecte per a rastrejar quines tecles estan pressionades
const keysPressed = {
    up: false,
    down: false,
    left: false,
    right: false,
};
// Conjunt per evitar múltiples col·lisions amb la mateixa estrella
const colisionesEstrellas = new Set();
// Funció per calcular l'angle segons la direcció
function getAngleFromDirection() {
    if (keysPressed.up && keysPressed.right)
        return 225;
    if (keysPressed.down && keysPressed.right)
        return 315;
    if (keysPressed.down && keysPressed.left)
        return 45;
    if (keysPressed.up && keysPressed.left)
        return 135;
    if (keysPressed.up)
        return 180;
    if (keysPressed.right)
        return 270;
    if (keysPressed.down)
        return 0;
    if (keysPressed.left)
        return 90;
    return currentAngle;
}
// Calcula la direcció principal basada en les tecles pressionades
function calculateMainDirection() {
    if (keysPressed.up && keysPressed.left)
        return "up-left";
    if (keysPressed.up && keysPressed.right)
        return "up-right";
    if (keysPressed.down && keysPressed.left)
        return "down-left";
    if (keysPressed.down && keysPressed.right)
        return "down-right";
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
// Envia la direcció al servidor
function sendDirection() {
    if (!ws || ws.readyState !== WebSocket.OPEN || playerId === null) {
        return;
    }
    const direction = calculateMainDirection();
    currentDirection = direction;
    currentAngle = getAngleFromDirection();
    ws.send(JSON.stringify({
        type: "direccio",
        id: playerId,
        direction: direction,
        angle: currentAngle,
    }));
}
// Gestiona quan es deixa de prémer una tecla
function aturarMoviment(ev) {
    if (!ws || ws.readyState !== WebSocket.OPEN || playerId === null) {
        return;
    }
    const prevState = { ...keysPressed };
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
    const directionChanged = prevState.up !== keysPressed.up ||
        prevState.down !== keysPressed.down ||
        prevState.left !== keysPressed.left ||
        prevState.right !== keysPressed.right;
    if (directionChanged) {
        sendDirection();
    }
}
// Gestiona quan es prem una tecla
function direccio(ev) {
    if (!ws || ws.readyState !== WebSocket.OPEN || playerId === null) {
        return;
    }
    if (ev.repeat)
        return;
    const prevState = { ...keysPressed };
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
            return;
    }
    const directionChanged = prevState.up !== keysPressed.up ||
        prevState.down !== keysPressed.down ||
        prevState.left !== keysPressed.left ||
        prevState.right !== keysPressed.right;
    if (directionChanged) {
        sendDirection();
    }
}
// Inicialitza la connexió amb el servidor
function init() {
    ws = new WebSocket("ws://localhost:8180");
    ws.onopen = function () {
        if (ws) {
            ws.send(JSON.stringify({ type: "player" }));
        }
    };
    ws.onclose = function () {
        alert("Connexió tancada. Tornant a la pàgina principal.");
        window.location.href = "index.html";
    };
    ws.onerror = function (error) {
        alert("Error en la connexió");
        window.location.href = "index.html";
    };
    ws.onmessage = function (event) {
        try {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case "connectat":
                    const connectedMsg = message;
                    playerId = connectedMsg.id;
                    setId(playerId);
                    if (connectedMsg.config) {
                        configurar(connectedMsg.config);
                        const scoreLimitInput = document.getElementById("scoreLimit");
                        if (scoreLimitInput && connectedMsg.config.scoreLimit) {
                            scoreLimitInput.value = connectedMsg.config.scoreLimit.toString();
                        }
                    }
                    break;
                case "config":
                    const configMsg = message;
                    if (!configMsg.data || typeof configMsg.data !== "object") {
                        return;
                    }
                    configurar(configMsg.data);
                    const scoreLimitInput = document.getElementById("scoreLimit");
                    if (scoreLimitInput && configMsg.data.scoreLimit) {
                        scoreLimitInput.value = configMsg.data.scoreLimit.toString();
                    }
                    break;
                case "dibuixar":
                    const drawMsg = message;
                    dibuixar(drawMsg.jugadors || [], drawMsg.pedres || []);
                    if (playerId !== null) {
                        const jugadorActual = drawMsg.jugadors?.find((j) => j.id === playerId);
                        if (jugadorActual) {
                            drawMsg.pedres?.forEach((estrella) => {
                                if (estrella.id !== undefined &&
                                    detectarColision(jugadorActual, estrella)) {
                                    if (!colisionesEstrellas.has(estrella.id)) {
                                        colisionesEstrellas.add(estrella.id);
                                        ws.send(JSON.stringify({
                                            type: "starCollision",
                                            jugadorId: playerId,
                                            estrellaId: estrella.id,
                                        }));
                                    }
                                }
                            });
                        }
                    }
                    if (drawMsg.pedres) {
                        const estrellasActualesIds = new Set();
                        drawMsg.pedres.forEach((p) => {
                            if (p.id !== undefined) {
                                estrellasActualesIds.add(p.id);
                            }
                        });
                        colisionesEstrellas.forEach((id) => {
                            if (!estrellasActualesIds.has(id)) {
                                colisionesEstrellas.delete(id);
                            }
                        });
                    }
                    break;
                case "ganador":
                    const winnerMsg = message;
                    break;
                case "engegar":
                    break;
                case "aturar":
                    import("./pyramid.js").then((module) => {
                        module.detenerTemporizador();
                    });
                    break;
                case "timeUpdate":
                    const timeUpdateMsg = message;
                    import("./pyramid.js").then((module) => {
                        module.actualizarTemporizador(timeUpdateMsg.remainingTime);
                    });
                    break;
                case "missatge":
                    const msgMsg = message;
                    break;
                case "colision":
                    currentDirection = null;
                    Object.keys(keysPressed).forEach((key) => {
                        keysPressed[key] = false;
                    });
                    sendDirection();
                    break;
                case "starCollision":
                    const starMsg = message;
                    const estrella = document.getElementById(`estrella-${starMsg.estrellaId}`);
                    if (estrella) {
                        const x = parseFloat(estrella.getAttribute("x") || "0");
                        const y = parseFloat(estrella.getAttribute("y") || "0");
                        mostrarEfectoRecoleccion(x, y);
                    }
                    break;
                case "timeUp":
                    const timeUpMsg = message;
                    break;
                case "starDisappear":
                    const disappearMsg = message;
                    const estrellaDesaparecida = document.getElementById(`estrella-${disappearMsg.estrellaId}`);
                    if (estrellaDesaparecida) {
                        const x = parseFloat(estrellaDesaparecida.getAttribute("x") || "0");
                        const y = parseFloat(estrellaDesaparecida.getAttribute("y") || "0");
                        import("./pyramid.js").then((module) => {
                            module.mostrarEfectoDesvanecimiento(x, y);
                        });
                    }
                    break;
                default:
            }
        }
        catch (error) { }
    };
    document.addEventListener("keydown", direccio);
    document.addEventListener("keyup", aturarMoviment);
}
window.onload = init;
