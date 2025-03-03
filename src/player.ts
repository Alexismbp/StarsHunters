"use strict";

// Importamos las funciones y tipos desde pyramid.ts
import {
  Jugador as Player,
  Pedra as Stone,
  Config as GameConfig,
  configurar,
  dibuixar,
  setId,
} from "./pyramid.js";

// Interfaces para mensajes
interface BaseMessage {
  type: string;
}

interface PlayerMessage extends BaseMessage {
  type: "player";
}

interface DirectionMessage extends BaseMessage {
  type: "direccio";
  id: number;
  direction: Direction;
}

interface GrabMessage extends BaseMessage {
  type: "agafar";
  id: number;
}

interface ConnectedMessage extends BaseMessage {
  type: "connectat";
  id: number;
  config?: GameConfig;
}

interface ConfigMessage extends BaseMessage {
  type: "config";
  data: GameConfig;
}

interface DrawMessage extends BaseMessage {
  type: "dibuixar";
  jugadors: Player[];
  pedres: Stone[];
  punts: number[];
}

interface MessageMessage extends BaseMessage {
  type: "missatge";
  text: string;
}

interface CollisionMessage extends BaseMessage {
  type: "colision";
}

// Tipos e interfaces adicionales
type Direction = "up" | "down" | "left" | "right" | null;

// Variables globales
let ws: WebSocket | null = null;
let playerId: number | null = null;
let currentDirection: Direction = null;
let moveInterval: number | null = null;

/*************************************************
 * EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
 *************************************************/

///////////////////////////////////////////////////////////
// ALUMNE: Alberto González, Biel Martínez
///////////////////////////////////////////////////////////

// Añadimos manejador para detener el movimiento cuando se suelta la tecla
function aturarMoviment(ev: KeyboardEvent): void {
  if (!ws || ws.readyState !== WebSocket.OPEN || playerId === null) {
    return;
  }

  // Solo detectamos teclas relevantes para el movimiento
  switch (ev.key) {
    case "ArrowUp":
    case "w":
    case "ArrowDown":
    case "s":
    case "ArrowLeft":
    case "a":
    case "ArrowRight":
    case "d":
      // Detener el intervalo y reiniciar la dirección
      if (moveInterval) {
        clearInterval(moveInterval);
        moveInterval = null;
        currentDirection = null;
      }
      break;
  }
}

// Gestor de l'esdeveniment per les tecles
function direccio(ev: KeyboardEvent): void {
  if (!ws || ws.readyState !== WebSocket.OPEN || playerId === null) {
    return;
  }

  // Moviment del jugador
  let newDirection: Direction = null;
  switch (ev.key) {
    case "ArrowUp":
    case "w":
      newDirection = "up";
      break;
    case "ArrowDown":
    case "s":
      newDirection = "down";
      break;
    case "ArrowLeft":
    case "a":
      newDirection = "left";
      break;
    case "ArrowRight":
    case "d":
      newDirection = "right";
      break;
    case " ":
    case "Enter":
      ws.send(
        JSON.stringify({
          type: "agafar",
          id: playerId,
        } as GrabMessage)
      );
      return;
  }

  // Si la direcció es vàlida, enviar el missatge al servidor
  if (newDirection) {
    // Aturem el moviment anterior (si hi ha)
    if (moveInterval) {
      clearInterval(moveInterval);
    }

    currentDirection = newDirection;

    // Crear un interval per enviar la direcció al servidor
    moveInterval = window.setInterval(() => {
      ws?.send(
        JSON.stringify({
          type: "direccio",
          id: playerId,
          direction: currentDirection,
        } as DirectionMessage)
      );
    }, 100);
  }
}

// Establir la connexió amb el servidor en el port 8180
function init(): void {
  // Inicialitzar la connexió WebSocket
  console.log("🚀 Inicialitzant connexió WebSocket...");
  ws = new WebSocket("ws://localhost:8180");

  ws.onopen = function (): void {
    // Enviar missatge de nou jugador
    console.log("✅ Connexió establerta amb el servidor");
    console.log("📤 Enviant petició de nou jugador");
    ws?.send(JSON.stringify({ type: "player" } as PlayerMessage));
  };

  ws.onclose = function (): void {
    // Tancar la connexió
    console.log("❌ Connexió tancada");
    alert("Connexió tancada. Tornant a la pàgina principal.");
    window.location.href = "index.html";
  };

  ws.onerror = function (error: Event): void {
    // Mostrar error i tancar la connexió
    console.log("❌ Error en la connexió:", error);
    alert("Error en la connexió");
    window.location.href = "index.html";
  };

  ws.onmessage = function (event: MessageEvent): void {
    // Processar missatges rebuts
    const message = JSON.parse(event.data) as BaseMessage;
    console.log("📩 Missatge rebut:", message);

    switch (message.type) {
      // Processar missatges segons el tipus
      case "connectat":
        const connectedMsg = message as ConnectedMessage;
        playerId = connectedMsg.id;
        // Establecer el ID en pyramid.ts
        setId(playerId);
        console.log("✅ Connectat com a jugador", playerId);

        // Pisos
        if (connectedMsg.config) {
          console.log("⚙️ Configuració inicial rebuda:", connectedMsg.config);
          configurar(connectedMsg.config);
          const pisosInput = document.getElementById(
            "pisos"
          ) as HTMLInputElement;
          pisosInput.value = connectedMsg.config.pisos.toString();
        }
        break;

      case "config":
        // Actualitzar la configuració del joc
        const configMsg = message as ConfigMessage;
        if (!configMsg.data || typeof configMsg.data !== "object") {
          console.error("❌ Dades de configuració invàlides");
          return;
        }
        console.log("⚙️ Nova configuració rebuda:", configMsg.data);
        configurar(configMsg.data);
        const pisosInput = document.getElementById("pisos") as HTMLInputElement;
        pisosInput.value = configMsg.data.pisos.toString();
        break;

      case "dibuixar":
        // Dibuixa jugador, pedres i punts
        const drawMsg = message as DrawMessage;
        console.log("🎨 Actualitzant estat del joc:", {
          jugadors: drawMsg.jugadors?.length || 0,
          pedres: drawMsg.pedres?.length || 0,
          punts: drawMsg.punts || [0, 0],
        });

        // Asegurar que punts es del tipo correcto [number, number]
        const punts: [number, number] =
          Array.isArray(drawMsg.punts) && drawMsg.punts.length >= 2
            ? [drawMsg.punts[0], drawMsg.punts[1]]
            : [0, 0];

        dibuixar(drawMsg.jugadors || [], drawMsg.pedres || [], punts);
        break;

      case "engegar":
        console.log("🎮 Joc iniciat");
        break;
      case "aturar":
        console.log("⏹️ Joc aturat");
        break;
      case "missatge":
        const msgMsg = message as MessageMessage;
        console.log("💬 Missatge del servidor:", msgMsg.text);
        break;
      case "colision":
        // Si hi ha col·lisió, aturar el moviment
        if (moveInterval) {
          clearInterval(moveInterval);
          moveInterval = null;
          currentDirection = null;
        }
        break;
      default:
        console.log("❓ Missatge no processat:", message);
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
