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
// Volvemos a las direcciones originales que reconoce el servidor
type Direction = "up" | "down" | "left" | "right" | null;

// Variables globales
let ws: WebSocket | null = null;
let playerId: number | null = null;
let currentDirection: Direction = null;
let moveInterval: number | null = null;
let diagonalInterval: number | null = null;

// Objeto para rastrear qué teclas están actualmente presionadas
const keysPressed: { [key: string]: boolean } = {
  up: false,
  down: false,
  left: false,
  right: false,
};

/*************************************************
 * EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
 *************************************************/

///////////////////////////////////////////////////////////
// ALUMNE: Alberto González, Biel Martínez
///////////////////////////////////////////////////////////

// Calcular la dirección principal basada en las teclas presionadas
function calculateMainDirection(): Direction {
  if (keysPressed.up) return "up";
  if (keysPressed.down) return "down";
  if (keysPressed.left) return "left";
  if (keysPressed.right) return "right";
  return null;
}

// Calcular dirección secundaria para movimiento diagonal
function calculateSecondaryDirection(): Direction {
  if (keysPressed.up && keysPressed.left) return "left";
  if (keysPressed.up && keysPressed.right) return "right";
  if (keysPressed.down && keysPressed.left) return "left";
  if (keysPressed.down && keysPressed.right) return "right";
  return null;
}

// Determinar si tenemos movimiento diagonal
function isDiagonalMovement(): boolean {
  return (
    (keysPressed.up && (keysPressed.left || keysPressed.right)) ||
    (keysPressed.down && (keysPressed.left || keysPressed.right))
  );
}

// Enviar una dirección al servidor
function sendDirection(direction: Direction): void {
  if (
    !ws ||
    ws.readyState !== WebSocket.OPEN ||
    playerId === null ||
    !direction
  ) {
    return;
  }

  ws.send(
    JSON.stringify({
      type: "direccio",
      id: playerId,
      direction: direction,
    })
  );
}

// Actualiza el movimiento basado en el estado actual de las teclas
function updateMovement(): void {
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
  if (!mainDirection) return;

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
  } else {
    // Movimiento normal
    moveInterval = window.setInterval(() => {
      sendDirection(mainDirection);
    }, 100);
  }
}

// Añadimos manejador para detener el movimiento cuando se suelta la tecla
function aturarMoviment(ev: KeyboardEvent): void {
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
function direccio(ev: KeyboardEvent): void {
  if (!ws || ws.readyState !== WebSocket.OPEN || playerId === null) {
    return;
  }

  // Evitar repetición si la tecla ya está presionada
  if (ev.repeat) return;

  // Para teclas de acción inmediata (espacio, enter)
  if (ev.key === " " || ev.key === "Enter") {
    ws.send(
      JSON.stringify({
        type: "agafar",
        id: playerId,
      })
    );
    return;
  }

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
function init(): void {
  // Inicialitzar la connexió WebSocket
  console.log("🚀 Inicialitzant connexió WebSocket...");
  ws = new WebSocket("ws://localhost:8180");

  ws.onopen = function (): void {
    // Enviar missatge de nou jugador
    console.log("✅ Connexió establerta amb el servidor");
    console.log("📤 Enviant petició de nou jugador");
    if (ws) {
      ws.send(JSON.stringify({ type: "player" }));
    }
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
    try {
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
            if (pisosInput) {
              pisosInput.value = connectedMsg.config.pisos.toString();
            }
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
          const pisosInput = document.getElementById(
            "pisos"
          ) as HTMLInputElement;
          if (pisosInput) {
            pisosInput.value = configMsg.data.pisos.toString();
          }
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

            // Reiniciar estado de teclas al detectar colisión
            Object.keys(keysPressed).forEach((key) => {
              keysPressed[key as keyof typeof keysPressed] = false;
            });
          }
          break;
        default:
          console.log("❓ Missatge no processat:", message);
      }
    } catch (error) {
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
