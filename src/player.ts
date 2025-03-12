"use strict";

import {
  Jugador as Player,
  Pedra as Stone,
  Config as GameConfig,
  configurar,
  dibuixar,
  setId,
  detectarColision,
  mostrarEfectoRecoleccion,
} from "./pyramid.js";

// Interfícies per a missatges
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
  angle?: number;
}

interface CollectStarMessage extends BaseMessage {
  type: "recolectarEstrella";
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
}

interface MessageMessage extends BaseMessage {
  type: "missatge";
  text: string;
}

interface CollisionMessage extends BaseMessage {
  type: "colision";
}

interface WinnerMessage extends BaseMessage {
  type: "ganador";
  id: string | number;
}

interface StarCollisionMessage extends BaseMessage {
  type: "starCollision";
  jugadorId: string | number;
  estrellaId: number;
  nuevaPuntuacion: number;
}

interface TimeUpMessage extends BaseMessage {
  type: "timeUp";
  empate: boolean;
  ganadorId: number | null;
  maximaPuntuacion: number;
}

interface TimeUpdateMessage extends BaseMessage {
  type: "timeUpdate";
  remainingTime: number;
}

interface StarDisappearMessage extends BaseMessage {
  type: "starDisappear";
  estrellaId: number;
}

// Tipus de direccions possibles incloent diagonals
type Direction =
  | "up"
  | "down"
  | "left"
  | "right"
  | "up-left"
  | "up-right"
  | "down-left"
  | "down-right"
  | null;

// Variables globals
let ws: WebSocket | null = null;
let playerId: number | null = null;
let currentDirection: Direction = null;
let currentAngle: number = 0;

// Objecte per a rastrejar quines tecles estan pressionades
const keysPressed: { [key: string]: boolean } = {
  up: false,
  down: false,
  left: false,
  right: false,
};

// Conjunt per evitar múltiples col·lisions amb la mateixa estrella
const colisionesEstrellas = new Set<number>();

// Funció per calcular l'angle segons la direcció
function getAngleFromDirection(): number {
  if (keysPressed.up && keysPressed.right) return 225;
  if (keysPressed.down && keysPressed.right) return 315;
  if (keysPressed.down && keysPressed.left) return 45;
  if (keysPressed.up && keysPressed.left) return 135;

  if (keysPressed.up) return 180;
  if (keysPressed.right) return 270;
  if (keysPressed.down) return 0;
  if (keysPressed.left) return 90;

  return currentAngle;
}

// Calcula la direcció principal basada en les tecles pressionades
function calculateMainDirection(): Direction {
  if (keysPressed.up && keysPressed.left) return "up-left";
  if (keysPressed.up && keysPressed.right) return "up-right";
  if (keysPressed.down && keysPressed.left) return "down-left";
  if (keysPressed.down && keysPressed.right) return "down-right";

  if (keysPressed.up) return "up";
  if (keysPressed.down) return "down";
  if (keysPressed.left) return "left";
  if (keysPressed.right) return "right";

  return null;
}

// Envia la direcció al servidor
function sendDirection(): void {
  if (!ws || ws.readyState !== WebSocket.OPEN || playerId === null) {
    return;
  }

  const direction = calculateMainDirection();

  currentDirection = direction;
  currentAngle = getAngleFromDirection();

  ws.send(
    JSON.stringify({
      type: "direccio",
      id: playerId,
      direction: direction,
      angle: currentAngle,
    })
  );
}

// Gestiona quan es deixa de prémer una tecla
function aturarMoviment(ev: KeyboardEvent): void {
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

  const directionChanged =
    prevState.up !== keysPressed.up ||
    prevState.down !== keysPressed.down ||
    prevState.left !== keysPressed.left ||
    prevState.right !== keysPressed.right;

  if (directionChanged) {
    sendDirection();
  }
}

// Gestiona quan es prem una tecla
function direccio(ev: KeyboardEvent): void {
  if (!ws || ws.readyState !== WebSocket.OPEN || playerId === null) {
    return;
  }

  if (ev.repeat) return;

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

  const directionChanged =
    prevState.up !== keysPressed.up ||
    prevState.down !== keysPressed.down ||
    prevState.left !== keysPressed.left ||
    prevState.right !== keysPressed.right;

  if (directionChanged) {
    sendDirection();
  }
}

// Inicialitza la connexió amb el servidor
function init(): void {
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  const host = window.location.host;
  ws = new WebSocket(`${protocol}${host}/ws`);

  ws.onopen = function (): void {
    if (ws) {
      ws.send(JSON.stringify({ type: "player" }));
    }
  };

  ws.onclose = function (): void {
    alert("Connexió tancada. Tornant a la pàgina principal.");
    window.location.href = "index.html";
  };

  ws.onerror = function (error: Event): void {
    alert("Error en la connexió");
    window.location.href = "index.html";
  };

  ws.onmessage = function (event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as BaseMessage;

      switch (message.type) {
        case "connectat":
          const connectedMsg = message as ConnectedMessage;
          playerId = connectedMsg.id;
          setId(playerId);

          if (connectedMsg.config) {
            configurar(connectedMsg.config);

            const scoreLimitInput = document.getElementById(
              "scoreLimit"
            ) as HTMLInputElement;
            if (scoreLimitInput && connectedMsg.config.scoreLimit) {
              scoreLimitInput.value = connectedMsg.config.scoreLimit.toString();
            }
          }
          break;

        case "config":
          const configMsg = message as ConfigMessage;
          if (!configMsg.data || typeof configMsg.data !== "object") {
            return;
          }
          configurar(configMsg.data);

          const scoreLimitInput = document.getElementById(
            "scoreLimit"
          ) as HTMLInputElement;
          if (scoreLimitInput && configMsg.data.scoreLimit) {
            scoreLimitInput.value = configMsg.data.scoreLimit.toString();
          }
          break;

        case "dibuixar":
          const drawMsg = message as DrawMessage;

          dibuixar(drawMsg.jugadors || [], drawMsg.pedres || []);

          if (playerId !== null) {
            const jugadorActual = drawMsg.jugadors?.find(
              (j) => j.id === playerId
            );
            if (jugadorActual) {
              drawMsg.pedres?.forEach((estrella) => {
                if (
                  estrella.id !== undefined &&
                  detectarColision(jugadorActual, estrella)
                ) {
                  if (!colisionesEstrellas.has(estrella.id)) {
                    colisionesEstrellas.add(estrella.id);

                    ws!.send(
                      JSON.stringify({
                        type: "starCollision",
                        jugadorId: playerId,
                        estrellaId: estrella.id,
                      })
                    );
                  }
                }
              });
            }
          }

          if (drawMsg.pedres) {
            const estrellasActualesIds = new Set<number>();
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
          const winnerMsg = message as WinnerMessage;
          import("./pyramid.js").then((module) => {
            module.detenerTemporizador();
            // Mostrar mensaje de ganador
            const svg = document.querySelector("svg") as SVGSVGElement;
            const winnerDisplay = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );
            winnerDisplay.setAttribute("id", "winner-display");

            // Fondo semitransparente
            const rect = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "rect"
            );
            rect.setAttribute("x", "0");
            rect.setAttribute("y", "0");
            rect.setAttribute("width", svg.getAttribute("width") || "800");
            rect.setAttribute("height", svg.getAttribute("height") || "600");
            rect.setAttribute("fill", "rgba(0,0,0,0.7)");
            winnerDisplay.appendChild(rect);

            // Texto de ganador
            const text = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "text"
            );
            text.setAttribute(
              "x",
              (parseInt(svg.getAttribute("width") || "800") / 2).toString()
            );
            text.setAttribute(
              "y",
              (parseInt(svg.getAttribute("height") || "600") / 2).toString()
            );
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-size", "48");
            text.setAttribute("fill", "#ffffff");
            text.textContent = `¡Jugador ${winnerMsg.id} GANA!`;
            winnerDisplay.appendChild(text);

            const subText = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "text"
            );
            subText.setAttribute(
              "x",
              (parseInt(svg.getAttribute("width") || "800") / 2).toString()
            );
            subText.setAttribute(
              "y",
              (
                parseInt(svg.getAttribute("height") || "600") / 2 +
                60
              ).toString()
            );
            subText.setAttribute("text-anchor", "middle");
            subText.setAttribute("font-size", "24");
            subText.setAttribute("fill", "#FFFFFF");
            subText.textContent = "¡Ha alcanzado el límite de puntuación!";
            winnerDisplay.appendChild(subText);

            // Eliminar cualquier mensaje de ganador existente
            const oldWinner = svg.getElementById("winner-display");
            if (oldWinner) {
              svg.removeChild(oldWinner);
            }

            svg.appendChild(winnerDisplay);
          });
          break;

        case "engegar":
          break;

        case "aturar":
          import("./pyramid.js").then((module) => {
            module.detenerTemporizador();
          });
          break;

        case "timeUpdate":
          const timeUpdateMsg = message as TimeUpdateMessage;

          import("./pyramid.js").then((module) => {
            module.actualizarTemporizador(timeUpdateMsg.remainingTime);
          });
          break;

        case "missatge":
          const msgMsg = message as MessageMessage;
          break;
        case "colision":
          currentDirection = null;

          Object.keys(keysPressed).forEach((key) => {
            keysPressed[key as keyof typeof keysPressed] = false;
          });

          sendDirection();
          break;

        case "starCollision":
          const starMsg = message as StarCollisionMessage;

          const estrella = document.getElementById(
            `estrella-${starMsg.estrellaId}`
          );

          if (estrella) {
            const x = parseFloat(estrella.getAttribute("x") || "0");
            const y = parseFloat(estrella.getAttribute("y") || "0");

            mostrarEfectoRecoleccion(x, y);
          }
          break;

        case "timeUp":
          const timeUpMsg = message as TimeUpMessage;
          import("./pyramid.js").then((module) => {
            module.detenerTemporizador();

            if (timeUpMsg.empate) {
              module.mostrarEmpate(timeUpMsg.maximaPuntuacion);
            } else if (timeUpMsg.ganadorId !== null) {
              const svg = document.querySelector("svg") as SVGSVGElement;
              const winnerDisplay = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "g"
              );
              winnerDisplay.setAttribute("id", "winner-display");

              // Fondo semitransparente
              const rect = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "rect"
              );
              rect.setAttribute("x", "0");
              rect.setAttribute("y", "0");
              rect.setAttribute("width", svg.getAttribute("width") || "800");
              rect.setAttribute("height", svg.getAttribute("height") || "600");
              rect.setAttribute("fill", "rgba(0,0,0,0.7)");
              winnerDisplay.appendChild(rect);

              // Texto de ganador
              const text = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
              );
              text.setAttribute(
                "x",
                (parseInt(svg.getAttribute("width") || "800") / 2).toString()
              );
              text.setAttribute(
                "y",
                (parseInt(svg.getAttribute("height") || "600") / 2).toString()
              );
              text.setAttribute("text-anchor", "middle");
              text.setAttribute("font-size", "48");
              text.setAttribute("fill", "#ffffff");
              text.textContent = `¡Jugador ${timeUpMsg.ganadorId} GANA!`;
              winnerDisplay.appendChild(text);

              const subText = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
              );
              subText.setAttribute(
                "x",
                (parseInt(svg.getAttribute("width") || "800") / 2).toString()
              );
              subText.setAttribute(
                "y",
                (
                  parseInt(svg.getAttribute("height") || "600") / 2 +
                  60
                ).toString()
              );
              subText.setAttribute("text-anchor", "middle");
              subText.setAttribute("font-size", "24");
              subText.setAttribute("fill", "#FFFFFF");
              subText.textContent =
                "¡Tenía la mayor puntuación al acabar el tiempo!";
              winnerDisplay.appendChild(subText);

              // Eliminar cualquier mensaje de ganador existente
              const oldWinner = svg.getElementById("winner-display");
              if (oldWinner) {
                svg.removeChild(oldWinner);
              }

              svg.appendChild(winnerDisplay);
            }
          });
          break;

        case "starDisappear":
          const disappearMsg = message as StarDisappearMessage;

          const estrellaDesaparecida = document.getElementById(
            `estrella-${disappearMsg.estrellaId}`
          );

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
    } catch (error) {}
  };

  document.addEventListener("keydown", direccio);
  document.addEventListener("keyup", aturarMoviment);
}

window.onload = init;
