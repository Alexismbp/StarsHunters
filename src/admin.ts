"use strict";

// Importamos los tipos y funciones desde pyramid.ts
import { Jugador, Pedra, Config, dibuixar, configurar } from "./pyramid.js";

/*************************************************
 * EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
 *************************************************/

// Definición de interfaces para los tipos de mensajes
interface ConfigMessage {
  type: "config";
  data: Config; // Usamos el tipo Config importado
}

interface CommandMessage {
  type: "start" | "stop" | "admin";
}

// Definiciones para los tipos de datos del juego
interface GameStateMessage {
  type: "dibuixar";
  jugadors?: Jugador[];
  pedres?: Pedra[];
  punts?: number[];
}

// Unión de todos los tipos de mensajes posibles
type WebSocketMessage =
  | ConfigMessage
  | CommandMessage
  | GameStateMessage
  | { type: string; [key: string]: any };

let ws: WebSocket;

///////////////////////////////////////////////////////////
// ALUMNE: Alberto González, Biel Martínez
///////////////////////////////////////////////////////////

// Gestor d'esdeveniment del botó 'Configurar'
// Enviar missatge 'config' amb les dades per configurar el servidor
function setConfig(): void {
  // Obtenir els valors dels camps d'entrada
  const width = parseInt(
    (document.getElementById("width") as HTMLInputElement).value
  );
  const height = parseInt(
    (document.getElementById("height") as HTMLInputElement).value
  );
  const pisos = parseInt(
    (document.getElementById("pisos") as HTMLInputElement).value
  );

  if (isNaN(width) || isNaN(height) || isNaN(pisos)) {
    alert("Si us plau, introdueix valors numèrics vàlids");
    return;
  }

  // Verificar que els valors estiguin dins dels rangs permesos
  if (
    width < 640 ||
    width > 1280 ||
    height < 480 ||
    height > 960 ||
    pisos < 4 ||
    pisos > 8
  ) {
    alert("Valors fora de rang. Si us plau, revisa les dades.");
    return;
  }

  // Crear l'objecte de configuració
  const config: ConfigMessage = {
    type: "config",
    data: {
      width: width,
      height: height,
      pisos: pisos,
    },
  };

  // Enviar el missatge al servidor a través del WebSocket
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(config));
    console.log("Configuració enviada al servidor:", config);
  } else {
    alert("Error: No s'ha pogut establir connexió amb el servidor.");
  }
}

// Gestor d'esdeveniment del botó 'Engegar/Aturar'
// Enviar missatge 'start' o 'stop' al servidor
function startStop(): void {
  // Verificar que hi ha connexió amb el servidor
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert("Error: No s'ha pogut establir connexió amb el servidor.");
    return;
  }

  // Obtenir el botó i determinar l'acció segons el seu text actual
  const boto = document.getElementById("engegar") as HTMLButtonElement;
  const esEngegar = boto.textContent === "Engegar";

  // Enviar missatge al servidor
  ws.send(
    JSON.stringify({
      type: esEngegar ? "start" : "stop",
    })
  );

  // Registrar l'acció per consola
  console.log(
    `S'ha enviat l'ordre de ${esEngegar ? "engegar" : "aturar"} el joc`
  );
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
function init(): void {
  // Estableix connexió WebSocket amb el servidor al port 8180
  ws = new WebSocket("ws://localhost:8180");

  // Quan s'estableix la connexió, envia missatge identificant-se com a administrador
  ws.onopen = function (): void {
    console.log("Connexió establerta amb el servidor");
    ws.send(JSON.stringify({ type: "admin" }));
  };

  // Gestió dels missatges rebuts del servidor
  ws.onmessage = function (event: MessageEvent): void {
    let message: WebSocketMessage;
    try {
      message = JSON.parse(event.data);
      console.log("📩 Missatge rebut:", message);
    } catch (error) {
      // Mostrar l'error
      console.error("❌ Error parsejant missatge:", error);
      return;
    }

    // Gestiona els diferents tipus de missatges
    switch (message.type) {
      case "config":
        // Actualitza els camps del formulari amb la configuració rebuda
        if ("data" in message) {
          (document.getElementById("width") as HTMLInputElement).value =
            message.data.width.toString();
          (document.getElementById("height") as HTMLInputElement).value =
            message.data.height.toString();
          (document.getElementById("pisos") as HTMLInputElement).value =
            message.data.pisos.toString();

          // También actualizar la configuración visual
          configurar(message.data);
        }
        break;
      case "engegar":
        // Canvia el text del botó a 'Aturar' quan el joc s'engega
        (document.getElementById("engegar") as HTMLButtonElement).textContent =
          "Aturar";
        break;
      case "aturar":
        // Canvia el text del botó a 'Engegar' quan el joc s'atura
        (document.getElementById("engegar") as HTMLButtonElement).textContent =
          "Engegar";
        break;
      case "dibuixar":
        // Registra l'estat actual del joc i actualitza el dibuix
        const gameState = message as GameStateMessage;
        console.log("🎨 Actualitzant estat del joc:", {
          jugadors: gameState.jugadors?.length || 0,
          pedres: gameState.pedres?.length || 0,
          punts: gameState.punts || [0, 0],
        });

        // Asegurar que punts es del tipo correcto [number, number]
        const punts: [number, number] =
          Array.isArray(gameState.punts) && gameState.punts.length >= 2
            ? [gameState.punts[0], gameState.punts[1]]
            : [0, 0];

        dibuixar(gameState.jugadors || [], gameState.pedres || [], punts);
        break;
      default:
        // Mostra per consola el missatge
        console.log("Missatge rebut:", message);
    }
  };

  // Gestión de errores y cierre de conexión
  ws.onclose = function (): void {
    alert("La connexió amb el servidor s'ha tancat.");
    window.location.href = "index.html";
  };

  ws.onerror = function (error: Event): void {
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
