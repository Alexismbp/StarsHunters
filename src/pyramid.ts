"use strict";

// Tipus per a les dades del joc
export type Jugador = {
  x: number;
  y: number;
  id: string | number;
  equipo?: 0 | 1;
  puntuacion: number;
  hasPedra?: boolean;
  color?: string;
  angle?: number;
};

export type Pedra = {
  x: number;
  y: number;
  id?: number;
};

export type Config = {
  width: number;
  height: number;
  scoreLimit: number;
  timeLimit?: number;
};

// Espai de noms per a SVG
const svgNS = "http://www.w3.org/2000/svg";

// Factor d'escala
const ESCALA: number = 4;

// Mides dels objectes
const MIDAJ: number = 8 * ESCALA;
const MIDAP: number = 4 * ESCALA;

// Rutes de les imatges
const NAU_PROPIA: string = "img/nau3.svg";
const NAU_ENEMIGA: string = "img/nau4.svg";
const ESTRELLA: string = "img/estrella.svg";

// Memòria cau d'imatges
const imageCache: { [key: string]: string } = {};

let connexio: any;
let config: Config = {
  width: 800,
  height: 600,
  scoreLimit: 10,
};
let id: string | number | undefined;
let svgInitialized: boolean = false;
let winner: string | number | null = null;
let timerInterval: number | null = null;
let remainingTime: number = 0;
let timerActive: boolean = false;

// Precarrega les imatges per millorar rendiment
function preloadImages(): void {
  const imagesToPreload = [NAU_PROPIA, NAU_ENEMIGA, ESTRELLA];

  imagesToPreload.forEach((src) => {
    if (!imageCache[src]) {
      fetch(src)
        .then((response) => response.text())
        .then((svgText) => {
          imageCache[src] = `data:image/svg+xml;base64,${btoa(svgText)}`;
          console.log(`Imagen precargada: ${src}`);
        })
        .catch((error) => {
          console.error(`Error al precargar ${src}:`, error);
        });
    }
  });
}

// Inicialitza l'estructura SVG si no existeix
function initializeSvgStructure(): void {
  if (svgInitialized) return;

  const svg = document.querySelector("svg");
  if (!svg) {
    console.error("Error: No se encontró el elemento SVG en el DOM");
    return;
  }

  const oldPyramid = svg.getElementById("pyramid");
  if (oldPyramid) {
    svg.removeChild(oldPyramid);
  }

  if (!svg.getElementById("players")) {
    const playersGroup = document.createElementNS(svgNS, "g");
    playersGroup.setAttributeNS(null, "id", "players");
    svg.appendChild(playersGroup);
  }

  if (!svg.getElementById("stones")) {
    const stonesGroup = document.createElementNS(svgNS, "g");
    stonesGroup.setAttribute("id", "stones");
    svg.appendChild(stonesGroup);
  }

  preloadImages();

  svgInitialized = true;
}

// Crea una imatge SVG amb rotació
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

  if (imageCache[src]) {
    img.setAttributeNS("http://www.w3.org/1999/xlink", "href", imageCache[src]);
  } else {
    img.setAttributeNS("http://www.w3.org/1999/xlink", "href", src);
  }

  angle = ((angle % 360) + 360) % 360;
  const isNave = src === NAU_PROPIA || src === NAU_ENEMIGA;

  if (angle !== 0 || isNave) {
    const transform = `rotate(${angle} ${centerX} ${centerY})`;
    img.setAttributeNS(null, "transform", transform);
  }

  return img;
}

// Mostra el guanyador a la pantalla
function mostrarGanador(jugadorId: string | number): void {
  winner = jugadorId;
  const svg = document.querySelector("svg") as SVGSVGElement;

  let winnerDisplay = svg.getElementById("winner-display");
  if (!winnerDisplay) {
    winnerDisplay = document.createElementNS(svgNS, "g");
    winnerDisplay.setAttribute("id", "winner-display");
    svg.appendChild(winnerDisplay);
  } else {
    while (winnerDisplay.firstChild) {
      winnerDisplay.removeChild(winnerDisplay.firstChild);
    }
  }

  const rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("x", "0");
  rect.setAttribute("y", "0");
  rect.setAttribute("width", config.width.toString());
  rect.setAttribute("height", config.height.toString());
  rect.setAttribute("fill", "rgba(0,0,0,0.7)");
  winnerDisplay.appendChild(rect);

  const text = document.createElementNS(svgNS, "text");
  text.setAttribute("x", (config.width / 2).toString());
  text.setAttribute("y", (config.height / 2).toString());
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("font-size", "48");
  text.setAttribute("fill", "#ffffff");
  text.textContent = `¡Jugador ${jugadorId} GANA!`;
  winnerDisplay.appendChild(text);

  const subText = document.createElementNS(svgNS, "text");
  subText.setAttribute("x", (config.width / 2).toString());
  subText.setAttribute("y", (config.height / 2 + 60).toString());
  subText.setAttribute("text-anchor", "middle");
  subText.setAttribute("font-size", "24");
  subText.setAttribute("fill", "#FFFFFF");
  subText.textContent = "¡Ha alcanzado el límite de puntuación!";
  winnerDisplay.appendChild(subText);
}

// Mostra les puntuacions dels jugadors
function mostrarPuntuaciones(jugadores: Jugador[]): void {
  const scoreContainer = document.getElementById("score-container");
  if (!scoreContainer) return;

  scoreContainer.innerHTML = "";

  const jugadoresOrdenados = [...jugadores].sort(
    (a, b) => b.puntuacion - a.puntuacion
  );

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";

  jugadoresOrdenados.forEach((jugador, index) => {
    const row = table.insertRow();

    if (jugador.id === id) {
      row.style.color = "#ffff00";
      row.style.fontWeight = "bold";
    }

    const cellJugador = row.insertCell();
    cellJugador.textContent = `Jugador ${jugador.id}`;
    cellJugador.style.padding = "5px 0";

    const cellPuntos = row.insertCell();
    cellPuntos.textContent = `${jugador.puntuacion}/${config.scoreLimit}`;
    cellPuntos.style.textAlign = "right";
    cellPuntos.style.padding = "5px 0";
  });

  scoreContainer.appendChild(table);
}

// Efecte visual quan es recull una estrella
export function mostrarEfectoRecoleccion(x: number, y: number): void {
  const svg = document.querySelector("svg") as SVGSVGElement;

  let effectsGroup = svg.getElementById("effects");
  if (!effectsGroup) {
    effectsGroup = document.createElementNS(svgNS, "g");
    effectsGroup.setAttribute("id", "effects");
    svg.appendChild(effectsGroup);
  }

  const glow = document.createElementNS(svgNS, "circle");
  glow.setAttribute("cx", (x + MIDAP / 2).toString());
  glow.setAttribute("cy", (y + MIDAP / 2).toString());
  glow.setAttribute("r", MIDAP.toString());
  glow.setAttribute("fill", "rgba(255, 255, 0, 0.5)");
  glow.setAttribute("filter", "blur(5px)");
  effectsGroup.appendChild(glow);

  for (let i = 0; i < 8; i++) {
    const particle = document.createElementNS(svgNS, "circle");
    particle.setAttribute("cx", (x + MIDAP / 2).toString());
    particle.setAttribute("cy", (y + MIDAP / 2).toString());
    particle.setAttribute("r", "2");
    particle.setAttribute("fill", "#ffff00");
    effectsGroup.appendChild(particle);

    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    let particleX = parseFloat((x + MIDAP / 2).toString());
    let particleY = parseFloat((y + MIDAP / 2).toString());

    const particleAnim = setInterval(() => {
      particleX += Math.cos(angle) * speed;
      particleY += Math.sin(angle) * speed;
      particle.setAttribute("cx", particleX.toString());
      particle.setAttribute("cy", particleY.toString());

      const opacity =
        parseFloat(particle.getAttribute("opacity") || "1.0") - 0.05;
      if (opacity <= 0) {
        clearInterval(particleAnim);
        effectsGroup?.removeChild(particle);
      } else {
        particle.setAttribute("opacity", opacity.toString());
      }
    }, 50);
  }

  let opacity = 0.5;
  const glowAnim = setInterval(() => {
    opacity -= 0.05;

    if (opacity <= 0) {
      clearInterval(glowAnim);
      if (effectsGroup && effectsGroup.contains(glow)) {
        effectsGroup.removeChild(glow);
      }
    } else {
      glow.setAttribute("opacity", opacity.toString());
    }
  }, 50);
}

// Efecte quan una estrella desapareix per temps
export function mostrarEfectoDesvanecimiento(x: number, y: number): void {
  const svg = document.querySelector("svg") as SVGSVGElement;

  let effectsGroup = svg.getElementById("effects");
  if (!effectsGroup) {
    effectsGroup = document.createElementNS(svgNS, "g");
    effectsGroup.setAttribute("id", "effects");
    svg.appendChild(effectsGroup);
  }

  const glow = document.createElementNS(svgNS, "circle");
  glow.setAttribute("cx", (x + MIDAP / 2).toString());
  glow.setAttribute("cy", (y + MIDAP / 2).toString());
  glow.setAttribute("r", MIDAP.toString());
  glow.setAttribute("fill", "rgba(100, 100, 255, 0.6)");
  glow.setAttribute("filter", "blur(3px)");
  effectsGroup.appendChild(glow);

  let opacity = 0.6;
  let scale = 1.0;
  const glowAnim = setInterval(() => {
    opacity -= 0.05;
    scale += 0.1;

    if (opacity <= 0) {
      clearInterval(glowAnim);
      if (effectsGroup && effectsGroup.contains(glow)) {
        effectsGroup.removeChild(glow);
      }
    } else {
      glow.setAttribute("opacity", opacity.toString());
      glow.setAttribute("r", (MIDAP * scale).toString());
    }
  }, 50);
}

// Detecta col·lisió entre nau i estrella
export function detectarColision(jugador: Jugador, estrella: Pedra): boolean {
  if (!jugador || !estrella) return false;

  const naveIzquierda = jugador.x;
  const naveDerecha = jugador.x + MIDAJ;
  const naveArriba = jugador.y;
  const naveAbajo = jugador.y + MIDAJ;

  const estrellaIzquierda = estrella.x;
  const estrellaDerecha = estrella.x + MIDAP;
  const estrellaArriba = estrella.y;
  const estrellaAbajo = estrella.y + MIDAP;

  return (
    naveIzquierda < estrellaDerecha &&
    naveDerecha > estrellaIzquierda &&
    naveArriba < estrellaAbajo &&
    naveAbajo > estrellaArriba
  );
}

// Dibuixa jugadors, estrelles i puntuació
export function dibuixar(jugadors: Jugador[], pedres: Pedra[]): void {
  initializeSvgStructure();

  let naveSrc: string;
  const svg = document.querySelector("svg") as SVGSVGElement;
  if (!svg) {
    console.error("Error: No se encontró el elemento SVG");
    return;
  }

  const ply = svg.getElementById("players") as SVGGElement;
  if (!ply) {
    console.error("Error: No se encontró el elemento con ID 'players'");
    return;
  }

  while (ply.firstChild) ply.removeChild(ply.firstChild);

  for (const j of jugadors) {
    if (id !== undefined && id === j.id) {
      naveSrc = NAU_PROPIA;
    } else {
      naveSrc = NAU_ENEMIGA;
    }

    const angle = j.angle || 0;
    const naveElement = imageSVG(j.x, j.y, MIDAJ, MIDAJ, naveSrc, angle);
    naveElement.setAttribute("id", `nave-${j.id}`);

    if (id !== undefined && id === j.id) {
      naveElement.setAttribute("filter", "drop-shadow(0 0 5px #ffff00)");
    }

    ply.appendChild(naveElement);
  }

  const stn = svg.getElementById("stones") as SVGGElement;
  if (!stn) {
    console.error("Error: No se encontró el elemento con ID 'stones'");
    return;
  }

  while (stn.firstChild) stn.removeChild(stn.firstChild);

  for (const p of pedres) {
    const estrellaElement = imageSVG(p.x, p.y, MIDAP, MIDAP, ESTRELLA);

    if (p.id !== undefined) {
      estrellaElement.setAttribute("id", `estrella-${p.id}`);
    }

    stn.appendChild(estrellaElement);
  }

  mostrarPuntuaciones(jugadors);

  if (timerActive) {
    mostrarTemporizador();
  }

  const ganador = jugadors.find((j) => j.puntuacion >= config.scoreLimit);
  if (ganador) {
    mostrarGanador(ganador.id);
    detenerTemporizador();
  }
}

// Configura les mides de la zona de joc
export function configurar(c: Config): void {
  config = c;

  if (config.scoreLimit === undefined) {
    config.scoreLimit = 10;
  }

  const svg = document.querySelector("svg") as SVGSVGElement;
  if (!svg) {
    console.error("Error: No se encontró el elemento SVG");
    return;
  }

  svg.setAttribute("width", config.width.toString());
  svg.setAttribute("height", config.height.toString());
  svg.setAttribute("viewBox", "0 0 " + config.width + " " + config.height);

  initializeSvgStructure();

  winner = null;

  const winnerDisplay = svg.getElementById("winner-display");
  if (winnerDisplay) {
    svg.removeChild(winnerDisplay);
  }
}

// Mostra el temporitzador al DOM
function mostrarTemporizador(): void {
  if (!timerActive) return;

  const timerContainer = document.getElementById("timer-container");
  if (!timerContainer) return;

  const minutos = Math.floor(remainingTime / 60);
  const segundos = remainingTime % 60;
  const tiempoFormateado = `${minutos}:${segundos < 10 ? "0" : ""}${segundos}`;

  const colorTiempo = remainingTime < 30 ? "#ff3333" : "#000000";

  timerContainer.innerHTML = `<div style="color: ${colorTiempo}">TIEMPO<br>${tiempoFormateado}</div>`;
}

// Actualitza el temporitzador amb el temps del servidor
export function actualizarTemporizador(tiempoRestante: number): void {
  if (!timerActive) {
    timerActive = true;
    remainingTime = tiempoRestante;
    mostrarTemporizador();

    if (timerInterval) {
      clearInterval(timerInterval);
    }

    timerInterval = window.setInterval(() => {
      remainingTime--;

      if (remainingTime <= 0) {
        detenerTemporizador();
        return;
      }

      mostrarTemporizador();
    }, 1000);
  } else {
    const diferencia = Math.abs(remainingTime - tiempoRestante);

    if (diferencia > 2) {
      remainingTime = tiempoRestante;
      mostrarTemporizador();
    }
  }
}

// Inicia o reinicia el temporitzador
export function iniciarTemporizador(tiempoTotal: number): void {
  detenerTemporizador();

  if (!tiempoTotal || tiempoTotal <= 0) return;

  remainingTime = tiempoTotal;
  timerActive = true;
  mostrarTemporizador();

  timerInterval = window.setInterval(() => {
    remainingTime--;

    if (remainingTime <= 0) {
      detenerTemporizador();
      return;
    }

    mostrarTemporizador();
  }, 1000);
}

// Atura el temporitzador
export function detenerTemporizador(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  timerActive = false;

  const timerContainer = document.getElementById("timer-container");
  if (timerContainer) {
    timerContainer.innerHTML = "";
  }
}

// Estableix l'ID del jugador actual
export function setId(newId: string | number): void {
  id = newId;
}

// Inicialitza l'estructura quan el DOM està carregat
document.addEventListener("DOMContentLoaded", () => {
  initializeSvgStructure();
  preloadImages();
});
