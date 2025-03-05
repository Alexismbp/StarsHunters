"use strict";

// Tipos para los datos
export type Jugador = {
  x: number;
  y: number;
  id: string | number;
  equipo?: 0 | 1; // Cambiado de team a equipo y hecho opcional
  puntuacion: number; // Añadir puntuación individual
  hasPedra?: boolean;
  color?: string;
  angle?: number; // Ángulo de rotación en grados (0 = hacia arriba, 90 = derecha, etc.)
};

export type Pedra = {
  x: number;
  y: number;
  id?: number;
};

export type Config = {
  width: number;
  height: number;
  scoreLimit: number; // Límite de puntuación para ganar
};

// Namespace per crear objectes SVG
const svgNS = "http://www.w3.org/2000/svg";

// Factor d'escala
const ESCALA: number = 4;

// Mida del jugador i pedra
const MIDAJ: number = 8 * ESCALA; // Tamaño nave
const MIDAP: number = 4 * ESCALA; // Tamaño estrella

// Colors dels jugadors
const COLORES_JUGADORES: string[] = [
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
];

// Ruta a las imágenes de las naves
const NAU_PROPIA: string = "img/nau3.svg"; // Nave del jugador actual
const NAU_ENEMIGA: string = "img/nau4.svg"; // Nave del enemigo
// Ruta a la imagen de la estrella
const ESTRELLA: string = "img/estrella.svg"; // Imagen de estrella para recolectar

// Orientación base de las imágenes de naves
const NAU_BASE_ANGLE: number = 0; // La nave sin rotar mira hacia arriba por defecto

let connexio: any;
// Inicializamos config con valores predeterminados
let config: Config = {
  width: 800, // valor predeterminado
  height: 600, // valor predeterminado
  scoreLimit: 10, // valor predeterminado para límite de puntuación
};
let id: string | number | undefined;
let svgInitialized: boolean = false;
let winner: string | number | null = null; // Variable para almacenar el ID del jugador ganador

// Función para inicializar la estructura SVG si no existe
function initializeSvgStructure(): void {
  // Verificamos si ya está inicializado
  if (svgInitialized) return;

  const svg = document.querySelector("svg");
  if (!svg) {
    console.error("Error: No se encontró el elemento SVG en el DOM");
    return;
  }

  // Eliminar grupos antiguos relacionados con pirámides si existen
  const oldPyramid = svg.getElementById("pyramid");
  if (oldPyramid) {
    svg.removeChild(oldPyramid);
  }

  // Crear solo los grupos necesarios
  if (!svg.getElementById("players")) {
    const playersGroup = document.createElementNS(svgNS, "g");
    playersGroup.setAttributeNS(null, "id", "players");
    svg.appendChild(playersGroup);
  }

  if (!svg.getElementById("stones")) {
    const stonesGroup = document.createElementNS(svgNS, "g");
    svg.appendChild(stonesGroup);
  }

  svgInitialized = true;
}

// Crear una imagen SVG para representar las naves con rotación
function imageSVG(
  x: number,
  y: number,
  width: number,
  height: number,
  src: string,
  angle: number = 0
): SVGImageElement {
  const img = document.createElementNS(svgNS, "image");

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  img.setAttributeNS(null, "x", x.toString());
  img.setAttributeNS(null, "y", y.toString());
  img.setAttributeNS(null, "width", width.toString());
  img.setAttributeNS(null, "height", height.toString());
  img.setAttributeNS("http://www.w3.org/1999/xlink", "href", src);

  // Normalizar el ángulo de entrada a un valor entre 0-359
  angle = ((angle % 360) + 360) % 360;

  // Aplicar la transformación de rotación
  if (angle !== 0) {
    const transform = `rotate(${angle} ${centerX} ${centerY})`;
    img.setAttributeNS(null, "transform", transform);
  }

  return img;
}

// Función para mostrar quién es el ganador
function mostrarGanador(jugadorId: string | number): void {
  winner = jugadorId;
  const svg = document.querySelector("svg") as SVGSVGElement;

  // Crear grupo para el mensaje de ganador si no existe
  let winnerDisplay = svg.getElementById("winner-display");
  if (!winnerDisplay) {
    winnerDisplay = document.createElementNS(svgNS, "g");
    winnerDisplay.setAttribute("id", "winner-display");
    svg.appendChild(winnerDisplay);
  } else {
    // Limpiar mensaje anterior
    while (winnerDisplay.firstChild) {
      winnerDisplay.removeChild(winnerDisplay.firstChild);
    }
  }

  // Crear rectángulo semitransparente de fondo
  const rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("x", "0");
  rect.setAttribute("y", "0");
  rect.setAttribute("width", config.width.toString());
  rect.setAttribute("height", config.height.toString());
  rect.setAttribute("fill", "rgba(0,0,0,0.7)");
  winnerDisplay.appendChild(rect);

  // Crear texto de ganador
  const text = document.createElementNS(svgNS, "text");
  text.setAttribute("x", (config.width / 2).toString());
  text.setAttribute("y", (config.height / 2).toString());
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("font-size", "48");
  text.setAttribute("fill", "#ffffff");
  text.textContent = `¡Jugador ${jugadorId} GANA!`;
  winnerDisplay.appendChild(text);

  // Texto adicional
  const subText = document.createElementNS(svgNS, "text");
  subText.setAttribute("x", (config.width / 2).toString());
  subText.setAttribute("y", (config.height / 2 + 60).toString());
  subText.setAttribute("text-anchor", "middle");
  subText.setAttribute("font-size", "24");
  subText.setAttribute("fill", "#FFFFFF");
  subText.textContent = "¡Ha alcanzado el límite de puntuación!";
  winnerDisplay.appendChild(subText);
}

// Función para mostrar las puntuaciones de todos los jugadores
function mostrarPuntuaciones(jugadores: Jugador[]): void {
  const svg = document.querySelector("svg") as SVGSVGElement;

  // Crear grupo para el marcador si no existe
  let scoreDisplay = svg.getElementById("score-display");
  if (!scoreDisplay) {
    scoreDisplay = document.createElementNS(svgNS, "g");
    scoreDisplay.setAttribute("id", "score-display");
    svg.appendChild(scoreDisplay);
  } else {
    // Limpiar marcador anterior
    while (scoreDisplay.firstChild) {
      scoreDisplay.removeChild(scoreDisplay.firstChild);
    }
  }

  // Fondo para el tablero de puntuaciones
  const backRect = document.createElementNS(svgNS, "rect");
  backRect.setAttribute("x", "10");
  backRect.setAttribute("y", "10");
  backRect.setAttribute("width", "180");
  backRect.setAttribute("height", (30 + 25 * jugadores.length).toString());
  backRect.setAttribute("fill", "rgba(0,0,0,0.5)");
  backRect.setAttribute("rx", "10");
  scoreDisplay.appendChild(backRect);

  // Título del tablero
  const title = document.createElementNS(svgNS, "text");
  title.setAttribute("x", "20");
  title.setAttribute("y", "35");
  title.setAttribute("font-size", "18");
  title.setAttribute("fill", "#ffffff");
  title.setAttribute("font-weight", "bold");
  title.textContent = "PUNTUACIONES:";
  scoreDisplay.appendChild(title);

  // Ordenar jugadores por puntuación (mayor a menor)
  const jugadoresOrdenados = [...jugadores].sort(
    (a, b) => b.puntuacion - a.puntuacion
  );

  // Mostrar puntuación de cada jugador
  jugadoresOrdenados.forEach((jugador, index) => {
    const playerScore = document.createElementNS(svgNS, "text");
    playerScore.setAttribute("x", "20");
    playerScore.setAttribute("y", (60 + index * 25).toString());
    playerScore.setAttribute("font-size", "16");

    // Destacar al jugador actual
    if (jugador.id === id) {
      playerScore.setAttribute("fill", "#ffff00"); // Amarillo para el jugador actual
      playerScore.setAttribute("font-weight", "bold");
    } else {
      playerScore.setAttribute("fill", "#ffffff");
    }

    playerScore.textContent = `Jugador ${jugador.id}: ${jugador.puntuacion}/${config.scoreLimit}`;
    scoreDisplay.appendChild(playerScore);
  });
}

// Añadir función para mostrar efecto cuando un jugador recoge una estrella
function mostrarEfectoRecoleccion(x: number, y: number): void {
  const svg = document.querySelector("svg") as SVGSVGElement;

  // Crear grupo para el efecto si no existe
  let effectsGroup = svg.getElementById("effects");
  if (!effectsGroup) {
    effectsGroup = document.createElementNS(svgNS, "g");
    effectsGroup.setAttribute("id", "effects");
    svg.appendChild(effectsGroup);
  }

  // Crear círculo que se expande y desaparece
  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", (x + MIDAP / 2).toString());
  circle.setAttribute("cy", (y + MIDAP / 2).toString());
  circle.setAttribute("r", "1");
  circle.setAttribute("fill", "rgba(255, 255, 0, 0.7)");
  circle.setAttribute("stroke", "#ffffff");
  circle.setAttribute("stroke-width", "1");
  effectsGroup.appendChild(circle);

  // Animar el círculo
  let radius = 1;
  let opacity = 0.7;
  const animation = setInterval(() => {
    radius += 2;
    opacity -= 0.05;

    if (radius > 30 || opacity <= 0) {
      clearInterval(animation);
      effectsGroup?.removeChild(circle);
    } else {
      circle.setAttribute("r", radius.toString());
      circle.setAttribute("fill", `rgba(255, 255, 0, ${opacity})`);
      circle.setAttribute("opacity", opacity.toString());
    }
  }, 50);
}

// Función para detectar colisión entre nave y estrella
export function detectarColision(jugador: Jugador, estrella: Pedra): boolean {
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
  // Usamos la mitad de la suma para ser más permisivos
  return distancia < (MIDAJ + MIDAP) / 2;
}

// Dibujar jugadores, estrellas y puntuación
export function dibuixar(jugadors: Jugador[], pedres: Pedra[]): void {
  initializeSvgStructure();

  let naveSrc: string;
  const svg = document.querySelector("svg") as SVGSVGElement;
  if (!svg) {
    console.error("Error: No se encontró el elemento SVG");
    return;
  }

  // Eliminar i redibuixar els jugadors
  const ply = svg.getElementById("players") as SVGGElement;
  if (!ply) {
    console.error("Error: No se encontró el elemento con ID 'players'");
    return;
  }

  while (ply.firstChild) ply.removeChild(ply.firstChild);

  for (const j of jugadors) {
    // Decidir qué imagen usar: nau3.png para el jugador actual, nau4.png para enemigos
    if (id !== undefined && id === j.id) {
      naveSrc = NAU_PROPIA; // Nave del jugador actual
    } else {
      naveSrc = NAU_ENEMIGA; // Nave del enemigo
    }

    // Definir el ángulo de rotación (0 por defecto si no está especificado)
    const angle = j.angle || 0;

    // Usar imageSVG con el ángulo de rotación para representar a los jugadores
    const naveElement = imageSVG(j.x, j.y, MIDAJ, MIDAJ, naveSrc, angle);

    // Añadir un identificador único para cada nave
    naveElement.setAttribute("id", `nave-${j.id}`);

    // Si es el jugador actual, añadir un brillo
    if (id !== undefined && id === j.id) {
      naveElement.setAttribute("filter", "drop-shadow(0 0 5px #ffff00)");
    }

    ply.appendChild(naveElement);
  }

  // Eliminar i redibuixar les pedretes
  const stn = svg.getElementById("stones") as SVGGElement;
  if (!stn) {
    console.error("Error: No se encontró el elemento con ID 'stones'");
    return;
  }

  while (stn.firstChild) stn.removeChild(stn.firstChild);

  for (const p of pedres) {
    // Usar imágenes SVG de estrellas
    const estrellaElement = imageSVG(p.x, p.y, MIDAP, MIDAP, ESTRELLA);

    // Añadir un identificador único para cada estrella
    if (p.id !== undefined) {
      estrellaElement.setAttribute("id", `estrella-${p.id}`);
    }

    stn.appendChild(estrellaElement);
  }

  // Mostrar la puntuación individual de cada jugador
  mostrarPuntuaciones(jugadors);

  // Comprobar si hay un ganador
  const ganador = jugadors.find((j) => j.puntuacion >= config.scoreLimit);
  if (ganador) {
    mostrarGanador(ganador.id);
  }
}

// Guardar i configurar les mides de la zona de joc
export function configurar(c: Config): void {
  // Guardar la configuració
  config = c;
  // Asegurar que scoreLimit tenga un valor
  if (config.scoreLimit === undefined) {
    config.scoreLimit = 10; // valor predeterminado
  }

  // Modificar la mida de la zona de joc
  const svg = document.querySelector("svg") as SVGSVGElement;
  if (!svg) {
    console.error("Error: No se encontró el elemento SVG");
    return;
  }

  svg.setAttribute("width", config.width.toString());
  svg.setAttribute("height", config.height.toString());
  svg.setAttribute("viewBox", "0 0 " + config.width + " " + config.height);

  // Inicializar la estructura SVG
  initializeSvgStructure();

  // Resetear el ganador al configurar un nuevo juego
  winner = null;

  // Limpiar pantalla de ganador si existe
  const winnerDisplay = svg.getElementById("winner-display");
  if (winnerDisplay) {
    svg.removeChild(winnerDisplay);
  }
}

// Añadir una función para exponer el ID al exterior
export function setId(newId: string | number): void {
  id = newId;
}

// Inicializar la estructura SVG cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", initializeSvgStructure);
