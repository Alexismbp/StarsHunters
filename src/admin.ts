"use strict";

// Importació dels tipus i funcions des de pyramid.ts
import {
  Jugador,
  Pedra,
  Config,
  dibuixar,
  configurar,
  actualizarTemporizador,
  detenerTemporizador,
} from "./pyramid.js";

// Definició d'interfícies per als tipus de missatges
interface ConfigMessage {
  type: "config";
  data: Config;
}

interface CommandMessage {
  type: "start" | "stop" | "admin";
}

// Definicions per als tipus de dades del joc
interface GameStateMessage {
  type: "dibuixar";
  jugadors?: Jugador[];
  pedres?: Pedra[];
  punts?: number[];
}

// Interfície per a missatges de temps
interface TimeUpdateMessage {
  type: "timeUpdate";
  remainingTime: number;
}

// Unió de tots els tipus de missatges possibles
type WebSocketMessage =
  | ConfigMessage
  | CommandMessage
  | GameStateMessage
  | TimeUpdateMessage
  | { type: string; [key: string]: any };

let ws: WebSocket;

// Funció per enviar la configuració al servidor
function setConfig(): void {
  // Obtenció dels valors dels camps d'entrada
  const width = parseInt(
    (document.getElementById("width") as HTMLInputElement).value
  );
  const height = parseInt(
    (document.getElementById("height") as HTMLInputElement).value
  );
  const scoreLimit = parseInt(
    (document.getElementById("scoreLimit") as HTMLInputElement)?.value || "10"
  );

  // Obtenció del temps límit
  const timeLimit = parseInt(
    (document.getElementById("timeLimit") as HTMLInputElement)?.value || "0"
  );

  if (isNaN(width) || isNaN(height) || isNaN(scoreLimit) || isNaN(timeLimit)) {
    alert("Si us plau, introdueix valors numèrics vàlids");
    return;
  }

  // Verificació dels valors
  if (
    width < 640 ||
    width > 1280 ||
    height < 480 ||
    height > 960 ||
    scoreLimit < 1 ||
    scoreLimit > 50 ||
    (timeLimit !== 0 && (timeLimit < 30 || timeLimit > 600))
  ) {
    alert("Valors fora de rang. Si us plau, revisa les dades.");
    return;
  }

  // Creació de l'objecte de configuració
  const config: ConfigMessage = {
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
  } else {
    alert("Error: No s'ha pogut establir connexió amb el servidor.");
  }
}

// Funció per engegar o aturar el joc
function startStop(): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert("Error: No s'ha pogut establir connexió amb el servidor.");
    return;
  }

  const boto = document.getElementById("engegar") as HTMLButtonElement;
  const esEngegar = boto.textContent === "Engegar";

  ws.send(
    JSON.stringify({
      type: esEngegar ? "start" : "stop",
    })
  );

  console.log(
    `S'ha enviat l'ordre de ${esEngegar ? "engegar" : "aturar"} el joc`
  );
}

// Funció d'inicialització
function init(): void {
  // Establiment de la connexió WebSocket
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  const host = window.location.host;
  ws = new WebSocket(`${protocol}${host}/ws`);

  // Gestió de l'obertura de la connexió
  ws.onopen = function (): void {
    console.log("Connexió establerta amb el servidor");
    ws.send(JSON.stringify({ type: "admin" }));
  };

  // Gestió dels missatges rebuts
  ws.onmessage = function (event: MessageEvent): void {
    let message: WebSocketMessage;
    try {
      message = JSON.parse(event.data);
      console.log("📩 Missatge rebut:", message);
    } catch (error) {
      console.error("❌ Error parsejant missatge:", error);
      return;
    }

    // Gestió dels diferents tipus de missatges
    switch (message.type) {
      case "config":
        if ("data" in message) {
          (document.getElementById("width") as HTMLInputElement).value =
            message.data.width.toString();
          (document.getElementById("height") as HTMLInputElement).value =
            message.data.height.toString();

          const pisosInput = document.getElementById(
            "pisos"
          ) as HTMLInputElement;
          if (pisosInput) {
            const pisosContainer = pisosInput.parentElement;
            if (pisosContainer) {
              pisosContainer.style.display = "none";
            }
          }

          const scoreLimitInput = document.getElementById(
            "scoreLimit"
          ) as HTMLInputElement;
          if (scoreLimitInput && message.data.scoreLimit !== undefined) {
            scoreLimitInput.value = message.data.scoreLimit.toString();
          }

          configurar(message.data);
        }
        break;
      case "engegar":
        (document.getElementById("engegar") as HTMLButtonElement).textContent =
          "Aturar";
        break;
      case "aturar":
        (document.getElementById("engegar") as HTMLButtonElement).textContent =
          "Engegar";
        detenerTemporizador();
        break;
      case "timeUpdate":
        const timeUpdateMsg = message as TimeUpdateMessage;
        console.log(
          `⏱️ Tiempo restante: ${timeUpdateMsg.remainingTime} segundos`
        );
        actualizarTemporizador(timeUpdateMsg.remainingTime);
        break;
      case "starCollision":
        if ("jugadorId" in message && "nuevaPuntuacion" in message) {
          console.log(
            `⭐ Jugador ${message.jugadorId} ha recogido una estrella. Nueva puntuación: ${message.nuevaPuntuacion}`
          );
        }
        break;
      case "dibuixar":
        const gameState = message as GameStateMessage;
        console.log("🎨 Actualitzant estat del joc:", {
          jugadors: gameState.jugadors?.length || 0,
          pedres: gameState.pedres?.length || 0,
        });
        dibuixar(gameState.jugadors || [], gameState.pedres || []);
        break;
      case "ganador":
        console.log(`🏆 Jugador ${message.id} ha guanyat!`);
        // Actualizar botón para permitir reiniciar
        (document.getElementById("engegar") as HTMLButtonElement).textContent =
          "Engegar";
        break;
      case "timeUp":
        console.log("⏰ Tiempo agotado, fin del juego");
        // Actualizar botón para permitir reiniciar
        (document.getElementById("engegar") as HTMLButtonElement).textContent =
          "Engegar";
        detenerTemporizador();
        break;
      default:
        console.log("Missatge rebut:", message);
    }
  };

  // Gestió d'errors i tancament de connexió
  ws.onclose = function (): void {
    alert("La connexió amb el servidor s'ha tancat.");
    window.location.href = "index.html";
  };

  ws.onerror = function (error: Event): void {
    alert("Error en la connexió amb el servidor.");
    console.error("Error de WebSocket:", error);
    window.location.href = "index.html";
  };

  // Assignació d'esdeveniments
  document.getElementById("configurar")?.addEventListener("click", setConfig);
  document.getElementById("engegar")?.addEventListener("click", startStop);
}

window.onload = init;
