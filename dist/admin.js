"use strict";
// Importació dels tipus i funcions des de pyramid.ts
import { dibuixar, configurar, actualizarTemporizador, detenerTemporizador, } from "./pyramid.js";
let ws;
// Funció per enviar la configuració al servidor
function setConfig() {
    // Obtenció dels valors dels camps d'entrada
    const width = parseInt(document.getElementById("width").value);
    const height = parseInt(document.getElementById("height").value);
    const scoreLimit = parseInt(document.getElementById("scoreLimit")?.value || "10");
    // Obtenció del temps límit
    const timeLimit = parseInt(document.getElementById("timeLimit")?.value || "0");
    if (isNaN(width) || isNaN(height) || isNaN(scoreLimit) || isNaN(timeLimit)) {
        alert("Si us plau, introdueix valors numèrics vàlids");
        return;
    }
    // Verificació dels valors
    if (width < 640 ||
        width > 1280 ||
        height < 480 ||
        height > 960 ||
        scoreLimit < 1 ||
        scoreLimit > 50 ||
        (timeLimit !== 0 && (timeLimit < 30 || timeLimit > 600))) {
        alert("Valors fora de rang. Si us plau, revisa les dades.");
        return;
    }
    // Creació de l'objecte de configuració
    const config = {
        type: "config",
        data: {
            width: width,
            height: height,
            scoreLimit: scoreLimit,
            timeLimit: timeLimit > 0 ? timeLimit : undefined,
        },
    };
    // Enviament del missatge al servidor
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(config));
        console.log("Configuració enviada al servidor:", config);
    }
    else {
        alert("Error: No s'ha pogut establir connexió amb el servidor.");
    }
}
// Funció per engegar o aturar el joc
function startStop() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert("Error: No s'ha pogut establir connexió amb el servidor.");
        return;
    }
    const boto = document.getElementById("engegar");
    const esEngegar = boto.textContent === "Engegar";
    ws.send(JSON.stringify({
        type: esEngegar ? "start" : "stop",
    }));
    console.log(`S'ha enviat l'ordre de ${esEngegar ? "engegar" : "aturar"} el joc`);
}
// Funció d'inicialització
function init() {
    // Establiment de la connexió WebSocket
    ws = new WebSocket("ws://localhost:8180");
    // Gestió de l'obertura de la connexió
    ws.onopen = function () {
        console.log("Connexió establerta amb el servidor");
        ws.send(JSON.stringify({ type: "admin" }));
    };
    // Gestió dels missatges rebuts
    ws.onmessage = function (event) {
        let message;
        try {
            message = JSON.parse(event.data);
            console.log("📩 Missatge rebut:", message);
        }
        catch (error) {
            console.error("❌ Error parsejant missatge:", error);
            return;
        }
        // Gestió dels diferents tipus de missatges
        switch (message.type) {
            case "config":
                if ("data" in message) {
                    document.getElementById("width").value =
                        message.data.width.toString();
                    document.getElementById("height").value =
                        message.data.height.toString();
                    const pisosInput = document.getElementById("pisos");
                    if (pisosInput) {
                        const pisosContainer = pisosInput.parentElement;
                        if (pisosContainer) {
                            pisosContainer.style.display = "none";
                        }
                    }
                    const scoreLimitInput = document.getElementById("scoreLimit");
                    if (scoreLimitInput && message.data.scoreLimit !== undefined) {
                        scoreLimitInput.value = message.data.scoreLimit.toString();
                    }
                    configurar(message.data);
                }
                break;
            case "engegar":
                document.getElementById("engegar").textContent =
                    "Aturar";
                break;
            case "aturar":
                document.getElementById("engegar").textContent =
                    "Engegar";
                detenerTemporizador();
                break;
            case "timeUpdate":
                const timeUpdateMsg = message;
                console.log(`⏱️ Tiempo restante: ${timeUpdateMsg.remainingTime} segundos`);
                actualizarTemporizador(timeUpdateMsg.remainingTime);
                break;
            case "starCollision":
                if ("jugadorId" in message && "nuevaPuntuacion" in message) {
                    console.log(`⭐ Jugador ${message.jugadorId} ha recogido una estrella. Nueva puntuación: ${message.nuevaPuntuacion}`);
                }
                break;
            case "dibuixar":
                const gameState = message;
                console.log("🎨 Actualitzant estat del joc:", {
                    jugadors: gameState.jugadors?.length || 0,
                    pedres: gameState.pedres?.length || 0,
                });
                dibuixar(gameState.jugadors || [], gameState.pedres || []);
                break;
            default:
                console.log("Missatge rebut:", message);
        }
    };
    // Gestió d'errors i tancament de connexió
    ws.onclose = function () {
        alert("La connexió amb el servidor s'ha tancat.");
        window.location.href = "index.html";
    };
    ws.onerror = function (error) {
        alert("Error en la connexió amb el servidor.");
        console.error("Error de WebSocket:", error);
        window.location.href = "index.html";
    };
    // Assignació d'esdeveniments
    document.getElementById("configurar")?.addEventListener("click", setConfig);
    document.getElementById("engegar")?.addEventListener("click", startStop);
}
window.onload = init;
