/******************************************************************************
 *						SERVIDOR WEB (port 8080)
 ******************************************************************************/

var http = require("http");
var url = require("url");
var fs = require("fs");

// Función para determinar el tipo MIME según la extensión
function getMimeType(filename) {
  const extension = filename.split(".").pop().toLowerCase();
  const mimeTypes = {
    html: "text/html",
    css: "text/css",
    js: "text/javascript",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
  };

  return mimeTypes[extension] || "application/octet-stream";
}

function header(resposta, codi, cType) {
  resposta.setHeader("Access-Control-Allow-Origin", "*");
  resposta.setHeader("Access-Control-Allow-Methods", "GET");
  if (cType) resposta.writeHead(codi, { "Content-Type": cType });
  else resposta.writeHead(codi);
}

function enviarArxiu(resposta, dades, filename, cType, err) {
  if (err) {
    header(resposta, 400, "text/html");
    resposta.end(
      "<p style='text-align:center;font-size:1.2rem;font-weight:bold;color:red'>Error al l legir l'arxiu</p>"
    );
    return;
  }

  header(resposta, 200, cType);
  resposta.write(dades);
  resposta.end();
}

function onRequest(peticio, resposta) {
  var cosPeticio = "";

  peticio
    .on("error", function (err) {
      console.error(err);
    })
    .on("data", function (dades) {
      cosPeticio += dades;
    })
    .on("end", function () {
      resposta.on("error", function (err) {
        console.error(err);
      });

      if (peticio.method == "GET") {
        var q = url.parse(peticio.url, true);
        var filename = "." + q.pathname;

        if (filename == "./") filename += "index.html";
        if (fs.existsSync(filename)) {
          // Determinar el tipo MIME según la extensión del archivo
          const mimeType = getMimeType(filename);
          console.log(`Sirviendo ${filename} con tipo MIME: ${mimeType}`);

          fs.readFile(filename, function (err, dades) {
            enviarArxiu(resposta, dades, filename, mimeType, err);
          });
        } else {
          header(resposta, 404, "text/html");
          resposta.end(
            "<p style='text-align:center;font-size:1.2rem;font-weight:bold;color:red'>404 Not Found</p>"
          );
        }
      }
    });
}

var server = http.createServer();
server.on("request", onRequest);
server.listen(8080);

/******************************************************************************
 *					SERVIDOR WEB SOCKETS (port 8180)
 ******************************************************************************/

// Factor d'escala
const ESCALA = 4;

// Nombre de pedres en la zona de joc
const MAXPED = 8;

// Increment del desplaçament horitzontal i vertical
const INCHV = ESCALA;

// Mida del jugador i pedra
const MIDAJ = 4 * ESCALA;
const MIDAP = 2 * ESCALA;

// Mida de l'àrea de joc i piràmide
const MINH = 40 * MIDAJ;
const MAXH = 2 * MINH;
const MINV = 30 * MIDAJ;
const MAXV = 2 * MINV;

// Mínim i màxim nombre de files de la piràmide
const NFPMIN = 4;
const NFPMAX = 8;

// Mida dels bloc per construir les piràmides
const PH = 4 * ESCALA;
const PV = 3 * ESCALA;

// Mida de les zones per construir les piràmides
const PHMAX = PH * NFPMAX;
const PVMAX = PV * NFPMAX;

// Temps en ms entre cada moviment
const TEMPS = 100;

var config = {
  width: MINH,
  height: MINV,
  pisos: NFPMIN,
  pedres: ((NFPMIN + 1) * NFPMIN) / 2,
};

/*************************************************
 * EN AQUEST APARTAT POTS AFEGIR O MODIFICAR CODI *
 *************************************************/

///////////////////////////////////////////////////////////
// ALUMNE: Biel Martínez, Alexis Boisset
///////////////////////////////////////////////////////////

/********** Servidor WebSockets **********/

// Carregar el mòdul per WebSockets
const WebSocket = require("ws");

// Crear servidor WebSocket
const wss = new WebSocket.Server({ port: 8180 });

// Esdeveniment del servidor 'wss' per gestionar la connexió d'un client 'ws'
//	Ha d'enviar la configuració actual al client que s'acaba de connectar
// Ha de crear els gestors dels esdeveniments:
//	- missatge (processar les diferents opcions del missatge)
//	- tancar (quan detecta que el client ha tancat la connexió)

// Variables per emmagatzemar l'estat del joc
let players = {};
let playerIdCounter = 0;
let gameRunning = false;
let gameInterval = null;
let adminWs = null;
let pedres = [];
let punts = [0, 0];
let idEstrella = 1; // ID para las estrellas, incrementa con cada nueva estrella

console.log("Servidor WebSocket escoltant al port 8180");
// Esdeveniment del servidor 'wss' per gestionar la connexió d'un client 'ws'
wss.on("connection", function connection(ws) {
  console.log("Nou client connectat");

  // Enviar la configuració actual al client que s'acaba de connectar
  ws.send(JSON.stringify({ type: "config", data: config }));

  // Gestor d'esdeveniments per quan el client envia un missatge
  ws.on("message", function incoming(message) {
    console.log("Missatge rebut: %s", message);
    processar(ws, message);
  });

  // Gestor d'esdeveniments per quan el client es desconnecta
  ws.on("close", function close() {
    tancar(ws);
  });

  // Gestor d'esdeveniments per errors
  ws.on("error", function error(err) {
    console.error("Error en la connexió: %s", err);
  });
});

/********** Gestors dels principals esdeveniments **********/
// 'ws' és la connexió (socket) del client
// 'm' és el missatge que ha enviat el client

// Esdeveniment: ha arribat un missatge d'un client
// Ha de processar els possibles missatges:
//	- crear administrador
//	- crear jugador
//	- configurar el joc (mida de la zona de joc i pisos de la piràmide)
//	- engegar el joc
//	- aturar el joc
//	- agafar (o deixar) una pedra
//	- modificar la direcció
function processar(ws, m) {
  try {
    // Processar Moviment del jugador
    const data = JSON.parse(m);
    console.log("📩 Missatge rebut:", data);

    switch (data.type) {
      case "admin":
        crearAdmin(ws, m);
        break;
      case "player":
        crearJugador(ws, m);
        break;
      case "config":
        configurar(ws, m);
        break;
      case "start":
        start(ws, m);
        break;
      case "stop":
        stop(ws, m);
        break;
      case "direccio":
        direccio(ws, m);
        break;
      case "agafar":
        agafar(ws, m);
        break;
      case "starCollision":
        // Manejar colisión con estrella
        const colisionData = JSON.parse(m);
        manejarColisionEstrella(
          colisionData.jugadorId,
          colisionData.estrellaId
        );
        break;
      default:
        console.log("❌ Tipus de missatge desconegut:", data.type);
    }
  } catch (error) {
    console.error("❌ Error processant missatge:", error);
  }
}
// Esdeveniment: un client  ha tancat la connexió
// Tenir en compte si és un jugador
//	per comptar els que té cada equip
function tancar(ws) {
  // Comprovar si el client desconnectat és un jugador
  const playerId = Object.keys(players).find((id) => players[id].ws === ws);
  if (playerId) {
    console.log(`Client desconnectat (ID: ${playerId})`);
    delete players[playerId];
    broadcastPlayers();
  }
}

/********** Funcions auxiliars (es criden des de processar()
 *********** per gestionar els diferents missatges **********/

// Esdeveniment: crear usuari administrador
//	- si ja existeix un administrador
//		tancar la connexió indicant el motiu
//	- crear l'administrador i enviar-li la configuració actual:
//		mida de la zona de joc i pisos de la piràmide
function crearAdmin(ws, m) {
  // Comprovar si ja hi ha un administrador
  if (adminWs !== null) {
    ws.close(1000, "Ja existeix un administrador");
    return;
  }

  // Guardar la connexió de l'administrador
  adminWs = ws;
  console.log("Administrador creat");

  // Enviar la configuració actual
  ws.send(
    JSON.stringify({
      type: "config",
      data: config,
    })
  );
}

// Esdeveniment: crear jugador
//	- si el joc està en marxa
//		tancar la connexió indicant el motiu
//	- crear el jugador assignant-li un identificador
//		que ha de ser diferent per cada jugador
//	- se li ha d'assignar un equip (0 o 1):
//		s'ha d'intentar que el nombre de jugadors
//		de cada equip sigui el més semblant possible
//	- s'ha de situar el jugador en la zona de joc
//		sense que se solapi amb qualsevol altre
//	- enviar-li el seu identificador i la configuració actual:
//		mida de la zona de joc i pisos de la piràmide
function crearJugador(ws, m) {
  // Verificar si el joc està en marxa
  if (gameRunning) {
    ws.close(1000, "El joc ja està en marxa");
    return;
  }

  const playerId = playerIdCounter++;
  console.log(`Nou jugador connectat amb ID: ${playerId}`);

  // Contar jugadors de cada equip
  let team0Count = 0,
    team1Count = 0;
  Object.values(players).forEach((player) => {
    if (player.team === 0) team0Count++;
    else team1Count++;
  });

  // Asignar equip basat en el nombre de jugadors
  const team = team0Count <= team1Count ? 0 : 1;

  // Crear un jugador con posición inicial, puntuación y dirección inicial
  players[playerId] = {
    id: playerId,
    ws: ws,
    x: team === 0 ? 0 : config.width - MIDAJ,
    y: team === 0 ? 0 : config.height - MIDAJ,
    team: team,
    puntuacion: 0,
    direction: null, // Inicializar dirección a null
  };

  // Enviar identificador i configuració
  ws.send(
    JSON.stringify({
      type: "connectat",
      id: playerId,
      config: config,
    })
  );

  // Enviar l'estat del joc a tots els clients
  enviarEstatJoc();
}

// Esborrar pedres (es crida des de configurar())
// Situar els jugadors en el costat dret o esquerre
//	segons l'equip, a intervals regulars
// Posar els punts dels dos equips a 0
function reiniciar() {
  // Resetear las puntuaciones y posiciones de todos los jugadores
  Object.values(players).forEach((jugador) => {
    jugador.puntuacion = 0;
    jugador.direction = null; // Resetear dirección
    if (jugador.team === 0) {
      jugador.x = 0;
      jugador.y = 0;
    } else {
      jugador.x = config.width - MIDAJ;
      jugador.y = config.height - MIDAJ;
    }
    delete jugador.stone;
  });

  // Reiniciar las estrellas
  inicializarEstrellas();

  enviarEstatJoc();
}

// Esdeveniment: configurar
//	- si l'usuari no és l'administrador
//		tancar la connexió indicant el motiu
//	- si el joc està en marxa
//		tancar la connexió indicant el motiu
//	- comprovar que la configuració passada sigui correcta:
//		mides i número de pisos
//	- calcular el número de pedres en funció dels pisos:
//		config.pedres = (config.pisos + 1) * config.pisos / 2;
//	- cridar la funció reiniciar
//	- enviar la configuració a tothom

function configurar(ws, m) {
  // Verificar que és l'administrador
  if (ws !== adminWs) {
    ws.close(1000, "No tens permís d'administrador");
    return;
  }

  // Verificar que el joc no està en marxa
  if (gameRunning) {
    ws.send(
      JSON.stringify({
        type: "missatge",
        text: "No es pot configurar mentre el joc està en marxa",
      })
    );
    return;
  }

  const data = JSON.parse(m);
  const newConfig = data.data;

  // Validar els valors
  if (
    newConfig.width < MINH ||
    newConfig.width > MAXH ||
    newConfig.height < MINV ||
    newConfig.height > MAXV ||
    newConfig.pisos < NFPMIN ||
    newConfig.pisos > NFPMAX
  ) {
    ws.send(
      JSON.stringify({
        type: "missatge",
        text: "Valors de configuració no vàlids",
      })
    );
    return;
  }

  // Actualitzar la configuració
  config = {
    ...newConfig,
    pedres: ((newConfig.pisos + 1) * newConfig.pisos) / 2,
  };

  // Reiniciar l'estat del joc
  reiniciar();

  // Enviar la nova configuració a tots els clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "config",
          data: config,
        })
      );
    }
  });
}

// Esdeveniment: engegar
//	- si l'usuari no és l'administrador
//		tancar la connexió indicant el motiu
//	- si el joc està en marxa
//		enviar missatge informatiu
//	- cridar la funció reiniciar, canviar l'estat del joc
//		i enviar-li missatge informatiu

function start(ws, m) {
  // Verificar si l'usuari és l'administrador
  if (ws !== adminWs) {
    ws.close(1000, "No tens permís d'administrador");
    return;
  }

  // Si el joc ja està en marxa, enviar missatge informatiu
  if (gameRunning) {
    ws.send(
      JSON.stringify({
        type: "missatge",
        text: "El joc ja està en marxa",
      })
    );
    return;
  }

  // Iniciar el joc
  gameRunning = true;
  reiniciar(); // Reiniciar l'estat del joc
  inicializarEstrellas(); // Inicializar las estrellas

  // Iniciar el temporitzador que crida a mou()
  gameInterval = setInterval(mou, TEMPS);

  // Enviar missatge a tots els clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "engegar" }));
    }
  });
}

// Esdeveniment: aturar
//	- si l'usuari no és l'administrador
//		tancar la connexió indicant el motiu
//	- si el joc està aturat
//		enviar missatge informatiu
//	- canviar l'estat del joc
//		i enviar-li missatge informatiu

function stop(ws, m) {
  // Verificar si l'usuari és l'administrador
  if (ws !== adminWs) {
    ws.close(1000, "No tens permís d'administrador");
    return;
  }

  // Si el joc ja està aturat, enviar missatge informatiu
  if (!gameRunning) {
    ws.send(
      JSON.stringify({
        type: "missatge",
        text: "El joc ja està aturat",
      })
    );
    return;
  }

  // Aturar el joc
  gameRunning = false;
  clearInterval(gameInterval); // Aturar el temporitzador

  // Enviar missatge a tots els clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "aturar" }));
    }
  });
}

// Esdeveniment: agafar / deixar
// Si el joc no està en marxa, no fer res
// Si el jugador no porta pedra:
//	- si està tocant (o a sobre) d'una pedra, agafar-la
// Si el jugador porta una pedra:
//	- si està fora de les zones de construcció, deixar la pedra
//	- si està en una zona de construcció que no és del seu equip, no deixar la pedra
//	- si està en la zeva zona de construcció, eliminar la pedra i afegir un punt al seu equip
//		si ja s'han posat totes les pedres, aturar el joc

function agafar(ws, m) {
  if (!gameRunning) return;

  const dades = JSON.parse(m);
  const jugador = players[dades.id];
  if (!jugador) return;

  if (!jugador.stone) {
    // Intentar agafar una pedra
    const indexPedra = pedres.findIndex(
      (pedra) =>
        Math.abs(pedra.x - jugador.x) < MIDAJ &&
        Math.abs(pedra.y - jugador.y) < MIDAJ
    );

    if (indexPedra !== -1) {
      jugador.stone = pedres[indexPedra];
      pedres.splice(indexPedra, 1);
    }
  } else {
    // Intentar deixar la pedra
    if (isInPyramidZone(jugador.x, jugador.y)) {
      if (isInTeamZone(jugador.x, jugador.y, jugador.team)) {
        // Afegir punt a l'equip
        punts[jugador.team]++;
        delete jugador.stone;

        // Comprovar si el joc ha d'acabar
        if (punts[0] + punts[1] >= config.pedres) {
          stop(adminWs, null);
        }
      }
    } else {
      // Deixar la pedra a la posició actual
      pedres.push({
        x: jugador.x,
        y: jugador.y,
      });
      delete jugador.stone;
    }
  }

  enviarEstatJoc();
}

// Esdeveniment: direcció
// Ahora solo actualiza la dirección del jugador y el ángulo, sin mover inmediatamente
function direccio(ws, m) {
  // Verificar si el joc està en marxa
  if (!gameRunning) return;

  const data = JSON.parse(m);
  const playerId = data.id;
  const player = players[playerId];

  if (player) {
    // Guardar la dirección actual del jugador
    player.direction = data.direction;

    // Guardar el ángulo recibido del cliente si existe
    if (data.angle !== undefined) {
      player.angle = data.angle;
    }
  }
}

function broadcastPlayers() {
  enviarEstatJoc();
}

/********** Temporitzador del joc **********/

// Cridar la funció mou() a intervals regulars (cada TEMPS mil·lisegons)

// Esdeveniment periòdic (cada 'TEMPS' mil·lisegons):
//	- incrementar la posició de cada jugador
//		comprovant que no surt de la zona de joc
//		i que no se solapa amb cap altre jugador
//	- si el jugador porta una pedra
//		també s'ha d'actualitzar la posició de la pedra
//	- si s'està jugant i no hi ha el màxim de pedres en la zona de joc
//		afegir una pedra en una posició aleatòria
//		evitant que quedi dins de les zones de construcció de les piràmides
//	- enviar un missatge a tothom
//		amb les posicions dels jugadors, les pedres (només si el joc està en marxa)
//		i la puntuació de cada equip (un punt per cada pedra posada en la piràmide)

function mou() {
  // Comprovar si el joc està en marxa
  if (!gameRunning) return;

  // Actualitzar posicions dels jugadors según su última dirección
  Object.values(players).forEach((player) => {
    // Mover el jugador según su dirección actual
    if (player.direction) {
      let newX = player.x;
      let newY = player.y;

      // Factor para movimiento diagonal (aproximadamente 0.7071 = 1/raíz cuadrada de 2)
      // Esto asegura que el movimiento diagonal no sea más rápido que el movimiento en línea recta
      const diagonalFactor = 0.7071;

      // Actualizar posición según la dirección guardada
      switch (player.direction) {
        case "up":
          newY -= INCHV;
          break;
        case "down":
          newY += INCHV;
          break;
        case "left":
          newX -= INCHV;
          break;
        case "right":
          newX += INCHV;
          break;
        // Nuevos casos para movimiento diagonal
        case "up-left":
          newX -= INCHV * diagonalFactor;
          newY -= INCHV * diagonalFactor;
          break;
        case "up-right":
          newX += INCHV * diagonalFactor;
          newY -= INCHV * diagonalFactor;
          break;
        case "down-left":
          newX -= INCHV * diagonalFactor;
          newY += INCHV * diagonalFactor;
          break;
        case "down-right":
          newX += INCHV * diagonalFactor;
          newY += INCHV * diagonalFactor;
          break;
      }

      // Comprobar que no sale de la zona de juego
      if (
        newX >= 0 &&
        newX <= config.width - MIDAJ &&
        newY >= 0 &&
        newY <= config.height - MIDAJ
      ) {
        player.x = newX;
        player.y = newY;

        // Actualizar posición de la piedra si la lleva
        if (player.stone) {
          player.stone.x = newX;
          player.stone.y = newY;
        }
      }
    }

    // Comprobar colisiones con estrellas
    pedres.forEach((estrella) => {
      if (detectarColision(player, estrella)) {
        manejarColisionEstrella(player.id, estrella.id);
      }
    });
  });

  // Garantizar que siempre haya MAXPED estrellas
  while (pedres.length < MAXPED) {
    pedres.push(generarEstrella());
  }

  // Enviar l'estat del joc a tots els clients
  enviarEstatJoc();
}

// Si esta en la zona de la piràmide
function isInPyramidZone(x, y) {
  return (
    (x < PHMAX || x > config.width - PHMAX) &&
    (y < PVMAX || y > config.height - PVMAX)
  );
}

// Si esta en la zona de l'equip
function isInTeamZone(x, y, team) {
  if (team === 0) {
    return x < PHMAX && y < PVMAX;
  } else {
    return x > config.width - PHMAX && y > config.height - PVMAX;
  }
}

function enviarEstatJoc() {
  // Enviar l'estat del joc a tots els clients
  const estatJoc = {
    type: "dibuixar",
    jugadors: Object.values(players),
    pedres: pedres,
    punts: punts,
  };

  wss.clients.forEach((client) => {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(estatJoc));
      }
    } catch (error) {
      console.error("Error enviant estat del joc:", error);
    }
  });
}

// Añadir función para detectar colisiones entre jugadores y estrellas
function detectarColision(jugador, estrella) {
  // Obtener las coordenadas del centro de la nave y la estrella
  const naveCentroX = jugador.x + MIDAJ / 2;
  const naveCentroY = jugador.y + MIDAJ / 2;
  const estrellaCentroX = estrella.x + MIDAP / 2;
  const estrellaCentroY = estrella.y + MIDAP / 2;

  // Calcular distancia entre los centros
  const distancia = Math.sqrt(
    Math.pow(naveCentroX - estrellaCentroX, 2) +
      Math.pow(naveCentroY - estrellaCentroY, 2)
  );

  // Si la distancia es menor que la suma de los radios, hay colisión
  return distancia < (MIDAJ + MIDAP) * 0.4; // Factor 0.4 para hacer la colisión más precisa
}

// Función para generar una nueva estrella en posición aleatoria
function generarEstrella() {
  const margen = MIDAP * 2; // Margen para evitar estrellas en los bordes

  // Generar posición aleatoria
  const x = margen + Math.random() * (config.width - margen * 2);
  const y = margen + Math.random() * (config.height - margen * 2);

  // Asignar un ID único a la estrella
  const id = idEstrella++;

  // Crear y devolver la nueva estrella
  return { x, y, id };
}

// Función para inicializar estrellas al comienzo del juego
function inicializarEstrellas() {
  pedres = []; // Limpiar estrellas existentes

  // Generar un número inicial de estrellas (MAXPED)
  for (let i = 0; i < MAXPED; i++) {
    pedres.push(generarEstrella());
  }
}

// Función para manejar la colisión de un jugador con una estrella
function manejarColisionEstrella(jugadorId, estrellaId) {
  // Verificar que el jugador existe
  const jugador = players[jugadorId];
  if (!jugador) return false;

  // Buscar la estrella
  const estrellaIndex = pedres.findIndex((e) => e.id === estrellaId);
  if (estrellaIndex === -1) return false; // La estrella no existe

  // Verificar la colisión
  const estrella = pedres[estrellaIndex];
  if (detectarColision(jugador, estrella)) {
    // Incrementar la puntuación del jugador
    if (!jugador.puntuacion) jugador.puntuacion = 0;
    jugador.puntuacion++;

    // Eliminar la estrella
    pedres.splice(estrellaIndex, 1);

    // Generar una nueva estrella
    pedres.push(generarEstrella());

    // Enviar un mensaje a todos los clientes
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "starCollision",
            jugadorId: jugadorId,
            estrellaId: estrellaId,
            nuevaPuntuacion: jugador.puntuacion,
          })
        );
      }
    });

    // Comprobar si el jugador ha ganado
    if (jugador.puntuacion >= config.scoreLimit) {
      // Enviar mensaje de ganador
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "ganador",
              id: jugadorId,
            })
          );
        }
      });

      // Detener el juego
      stop(adminWs, null);
    }

    return true;
  }

  return false;
}
