"use strict";
// Importamos los tipos y funciones desde pyramid.ts
import { dibuixar, configurar, actualizarTemporizador, // Añadimos la importación para el temporizador
detenerTemporizador, // Importamos también la función para detener el temporizador
 } from "./pyramid.js";
let ws;
///////////////////////////////////////////////////////////
// ALUMNE: Alberto González, Biel Martínez
///////////////////////////////////////////////////////////
// Gestor d'esdeveniment del botó 'Configurar'
// Enviar missatge 'config' amb les dades per configurar el servidor
function setConfig() {
    // Obtenir els valors dels camps d'entrada
    const width = parseInt(document.getElementById("width").value);
    const height = parseInt(document.getElementById("height").value);
    const scoreLimit = parseInt(document.getElementById("scoreLimit")?.value || "10");
    // Obtener el tiempo límite
    const timeLimit = parseInt(document.getElementById("timeLimit")?.value || "0");
    if (isNaN(width) || isNaN(height) || isNaN(scoreLimit) || isNaN(timeLimit)) {
        alert("Si us plau, introdueix valors numèrics vàlids");
        return;
    }
    // Verificar que els valors estiguin dins dels rangs permesos
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
    // Crear l'objecte de configuració
    const config = {
        type: "config",
        data: {
            width: width,
            height: height,
            scoreLimit: scoreLimit,
            timeLimit: timeLimit > 0 ? timeLimit : undefined, // Solo enviar si es mayor que 0
        },
    };
    // Enviar el missatge al servidor a través del WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(config));
        console.log("Configuració enviada al servidor:", config);
    }
    else {
        alert("Error: No s'ha pogut establir connexió amb el servidor.");
    }
}
// Gestor d'esdeveniment del botó 'Engegar/Aturar'
// Enviar missatge 'start' o 'stop' al servidor
function startStop() {
    // Verificar que hi ha connexió amb el servidor
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert("Error: No s'ha pogut establir connexió amb el servidor.");
        return;
    }
    // Obtenir el botó i determinar l'acció segons el seu text actual
    const boto = document.getElementById("engegar");
    const esEngegar = boto.textContent === "Engegar";
    // Enviar missatge al servidor
    ws.send(JSON.stringify({
        type: esEngegar ? "start" : "stop",
    }));
    // Registrar l'acció per consola
    console.log(`S'ha enviat l'ordre de ${esEngegar ? "engegar" : "aturar"} el joc`);
}
// Establir la connexió amb el servidor en el port 8180
//	S'ha poder accedir utilitzant localhost o una adreça IP local
// Gestionar esdeveniments de la connexió
//	- a l'establir la connexió (open): enviar missatge al servidor indicant que s'ha d'afegir l'administrador
//	- si es tanca la connexió (close): informar amb alert() i tornar a la pàgina principal (index.html)
//	- en cas d'error: mostrar l'error amb alert() i tornar a la pàgina principal (index.html)
//	- quan arriba un missatge (tipus de missatge):
//		- configurar: cridar la funció configurar() passant-li les dades de configuració
//			i actualitzar els valors dels inputs 'width', 'height' i 'pisos'
//		- dibuixar: cridar la funció dibuixar() passant-li les dades per dibuixar jugadors, pedres i piràmides (punts)
//		- engegar: canviar el text del botó 'Engegar' per 'Aturar'
//		- aturar: canviar el text del botó 'Aturar' per 'Engegar'
//		- missatge: mostrar el missatge per consola
function init() {
    // Estableix connexió WebSocket amb el servidor al port 8180
    ws = new WebSocket("ws://localhost:8180");
    // Quan s'estableix la connexió, envia missatge identificant-se com a administrador
    ws.onopen = function () {
        console.log("Connexió establerta amb el servidor");
        ws.send(JSON.stringify({ type: "admin" }));
    };
    // Gestió dels missatges rebuts del servidor
    ws.onmessage = function (event) {
        let message;
        try {
            message = JSON.parse(event.data);
            console.log("📩 Missatge rebut:", message);
        }
        catch (error) {
            // Mostrar l'error
            console.error("❌ Error parsejant missatge:", error);
            return;
        }
        // Gestiona els diferents tipus de missatges
        switch (message.type) {
            case "config":
                // Actualitza els camps del formulari amb la configuració rebuda
                if ("data" in message) {
                    document.getElementById("width").value =
                        message.data.width.toString();
                    document.getElementById("height").value =
                        message.data.height.toString();
                    // Eliminar el campo de pisos si existe
                    const pisosInput = document.getElementById("pisos");
                    if (pisosInput) {
                        // Ocultar el campo de pisos
                        const pisosContainer = pisosInput.parentElement;
                        if (pisosContainer) {
                            pisosContainer.style.display = "none";
                        }
                    }
                    // Actualizar el campo de límite de puntuación si existe
                    const scoreLimitInput = document.getElementById("scoreLimit");
                    if (scoreLimitInput && message.data.scoreLimit !== undefined) {
                        scoreLimitInput.value = message.data.scoreLimit.toString();
                    }
                    // También actualizar la configuración visual
                    configurar(message.data);
                }
                break;
            case "engegar":
                // Canvia el text del botó a 'Aturar' quan el joc s'engega
                document.getElementById("engegar").textContent =
                    "Aturar";
                break;
            case "aturar":
                // Canvia el text del botó a 'Engegar' quan el joc s'atura
                document.getElementById("engegar").textContent =
                    "Engegar";
                // Detener el temporizador cuando se detiene el juego
                detenerTemporizador();
                break;
            case "timeUpdate":
                // Añadimos el procesamiento de los mensajes de actualización de tiempo
                const timeUpdateMsg = message;
                console.log(`⏱️ Tiempo restante: ${timeUpdateMsg.remainingTime} segundos`);
                // Actualizar el temporizador con el tiempo recibido
                actualizarTemporizador(timeUpdateMsg.remainingTime);
                break;
            case "starCollision":
                // Registrar cuando un jugador recoge una estrella
                if ("jugadorId" in message && "nuevaPuntuacion" in message) {
                    console.log(`⭐ Jugador ${message.jugadorId} ha recogido una estrella. Nueva puntuación: ${message.nuevaPuntuacion}`);
                }
                break;
            case "dibuixar":
                // Registra l'estat actual del joc i actualitza el dibuix
                const gameState = message;
                console.log("🎨 Actualitzant estat del joc:", {
                    jugadors: gameState.jugadors?.length || 0,
                    pedres: gameState.pedres?.length || 0,
                });
                dibuixar(gameState.jugadors || [], gameState.pedres || []);
                break;
            default:
                // Mostra per consola el missatge
                console.log("Missatge rebut:", message);
        }
    };
    // Gestión de errores y cierre de conexión
    ws.onclose = function () {
        alert("La connexió amb el servidor s'ha tancat.");
        window.location.href = "index.html";
    };
    ws.onerror = function (error) {
        alert("Error en la connexió amb el servidor.");
        console.error("Error de WebSocket:", error);
        window.location.href = "index.html";
    };
    // Gestors d'esdeveniments
    document.getElementById("configurar")?.addEventListener("click", setConfig);
    document.getElementById("engegar")?.addEventListener("click", startStop);
}
/***********************************************
 * FINAL DE L'APARTAT ON POTS FER MODIFICACIONS *
 ***********************************************/
window.onload = init;
