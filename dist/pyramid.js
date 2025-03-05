"use strict";
// Namespace per crear objectes SVG
const svgNS = "http://www.w3.org/2000/svg";
// Factor d'escala
const ESCALA = 4;
// Mida del jugador i pedra
const MIDAJ = 8 * ESCALA; // Tamaño nave
const MIDAP = 4 * ESCALA; // Tamaño estrella
// Colors dels jugadors
const COLORES_JUGADORES = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
];
// Ruta a las imágenes de las naves
const NAU_PROPIA = "img/nau3.svg"; // Nave del jugador actual
const NAU_ENEMIGA = "img/nau4.svg"; // Nave del enemigo
// Ruta a la imagen de la estrella
const ESTRELLA = "img/estrella.svg"; // Imagen de estrella para recolectar
// Caché de imágenes para evitar cargas repetitivas
const imageCache = {};
let connexio;
// Inicializamos config con valores predeterminados
let config = {
    width: 800, // valor predeterminado
    height: 600, // valor predeterminado
    scoreLimit: 10, // valor predeterminado para límite de puntuación
};
let id;
let svgInitialized = false;
let winner = null; // Variable para almacenar el ID del jugador ganador
let timerInterval = null; // Para guardar el intervalo del temporizador
let remainingTime = 0; // Tiempo restante en segundos
let timerActive = false; // Para controlar si el temporizador está activo
// Función para precargar las imágenes en el caché
function preloadImages() {
    const imagesToPreload = [NAU_PROPIA, NAU_ENEMIGA, ESTRELLA];
    imagesToPreload.forEach((src) => {
        // Solo cargar si no existe en caché
        if (!imageCache[src]) {
            fetch(src)
                .then((response) => response.text())
                .then((svgText) => {
                // Almacenar el contenido SVG en el caché
                imageCache[src] = `data:image/svg+xml;base64,${btoa(svgText)}`;
                console.log(`Imagen precargada: ${src}`);
            })
                .catch((error) => {
                console.error(`Error al precargar ${src}:`, error);
            });
        }
    });
}
// Función para inicializar la estructura SVG si no existe
function initializeSvgStructure() {
    // Verificamos si ya está inicializado
    if (svgInitialized)
        return;
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
        stonesGroup.setAttribute("id", "stones");
        svg.appendChild(stonesGroup);
    }
    // Precargar imágenes al inicializar
    preloadImages();
    svgInitialized = true;
}
// Crear una imagen SVG para representar las naves con rotación
function imageSVG(x, y, width, height, src, angle = 0) {
    const img = document.createElementNS(svgNS, "image");
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    img.setAttributeNS(null, "x", x.toString());
    img.setAttributeNS(null, "y", y.toString());
    img.setAttributeNS(null, "width", width.toString());
    img.setAttributeNS(null, "height", height.toString());
    // Usar imagen desde el caché si está disponible
    if (imageCache[src]) {
        img.setAttributeNS("http://www.w3.org/1999/xlink", "href", imageCache[src]);
    }
    else {
        img.setAttributeNS("http://www.w3.org/1999/xlink", "href", src);
    }
    // Normalizar el ángulo de entrada a un valor entre 0-359
    angle = ((angle % 360) + 360) % 360;
    // Verificar si es una nave (no es una estrella)
    const isNave = src === NAU_PROPIA || src === NAU_ENEMIGA;
    // Aplicar la transformación de rotación
    if (angle !== 0 || isNave) {
        // Para naves, aseguramos que la orientación sea correcta
        // El ángulo ya viene calculado correctamente desde Player.ts
        const transform = `rotate(${angle} ${centerX} ${centerY})`;
        img.setAttributeNS(null, "transform", transform);
    }
    return img;
}
// Función para mostrar quién es el ganador
function mostrarGanador(jugadorId) {
    winner = jugadorId;
    const svg = document.querySelector("svg");
    // Crear grupo para el mensaje de ganador si no existe
    let winnerDisplay = svg.getElementById("winner-display");
    if (!winnerDisplay) {
        winnerDisplay = document.createElementNS(svgNS, "g");
        winnerDisplay.setAttribute("id", "winner-display");
        svg.appendChild(winnerDisplay);
    }
    else {
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
// Función para mostrar las puntuaciones de todos los jugadores (fuera del SVG)
function mostrarPuntuaciones(jugadores) {
    // Buscar el contenedor de puntuaciones en HTML
    const scoreContainer = document.getElementById("score-container");
    if (!scoreContainer)
        return;
    // Limpiar contenedor
    scoreContainer.innerHTML = "";
    // Ordenar jugadores por puntuación (mayor a menor)
    const jugadoresOrdenados = [...jugadores].sort((a, b) => b.puntuacion - a.puntuacion);
    // Crear tabla de puntuaciones
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    // Mostrar puntuación de cada jugador
    jugadoresOrdenados.forEach((jugador, index) => {
        const row = table.insertRow();
        // Destacar al jugador actual
        if (jugador.id === id) {
            row.style.color = "#ffff00"; // Amarillo para el jugador actual
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
// Mejorar función para mostrar efecto cuando un jugador recoge una estrella
export function mostrarEfectoRecoleccion(x, y) {
    const svg = document.querySelector("svg");
    // Crear grupo para el efecto si no existe
    let effectsGroup = svg.getElementById("effects");
    if (!effectsGroup) {
        effectsGroup = document.createElementNS(svgNS, "g");
        effectsGroup.setAttribute("id", "effects");
        svg.appendChild(effectsGroup);
    }
    // Crear un resplandor alrededor de la estrella que desaparece
    const glow = document.createElementNS(svgNS, "circle");
    glow.setAttribute("cx", (x + MIDAP / 2).toString());
    glow.setAttribute("cy", (y + MIDAP / 2).toString());
    glow.setAttribute("r", MIDAP.toString());
    glow.setAttribute("fill", "rgba(255, 255, 0, 0.5)");
    glow.setAttribute("filter", "blur(5px)");
    effectsGroup.appendChild(glow);
    // Crear partículas que se dispersen
    for (let i = 0; i < 8; i++) {
        const particle = document.createElementNS(svgNS, "circle");
        particle.setAttribute("cx", (x + MIDAP / 2).toString());
        particle.setAttribute("cy", (y + MIDAP / 2).toString());
        particle.setAttribute("r", "2");
        particle.setAttribute("fill", "#ffff00");
        effectsGroup.appendChild(particle);
        // Dirección aleatoria para cada partícula
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        let particleX = parseFloat((x + MIDAP / 2).toString());
        let particleY = parseFloat((y + MIDAP / 2).toString());
        // Animar partícula
        const particleAnim = setInterval(() => {
            particleX += Math.cos(angle) * speed;
            particleY += Math.sin(angle) * speed;
            particle.setAttribute("cx", particleX.toString());
            particle.setAttribute("cy", particleY.toString());
            // Desvanecer partícula
            const opacity = parseFloat(particle.getAttribute("opacity") || "1.0") - 0.05;
            if (opacity <= 0) {
                clearInterval(particleAnim);
                effectsGroup?.removeChild(particle);
            }
            else {
                particle.setAttribute("opacity", opacity.toString());
            }
        }, 50);
    }
    // Animar el resplandor
    let opacity = 0.5;
    const glowAnim = setInterval(() => {
        opacity -= 0.05;
        if (opacity <= 0) {
            clearInterval(glowAnim);
            if (effectsGroup && effectsGroup.contains(glow)) {
                effectsGroup.removeChild(glow);
            }
        }
        else {
            glow.setAttribute("opacity", opacity.toString());
        }
    }, 50);
    // Añadir efecto de sonido
    try {
        const audio = new Audio("sound/star.mp3");
        audio.volume = 0.5;
        audio.play();
    }
    catch (error) {
        console.log("No se pudo reproducir el sonido");
    }
}
// Función para mostrar efecto de desvanecimiento cuando una estrella desaparece por tiempo
export function mostrarEfectoDesvanecimiento(x, y) {
    const svg = document.querySelector("svg");
    // Crear grupo para el efecto si no existe
    let effectsGroup = svg.getElementById("effects");
    if (!effectsGroup) {
        effectsGroup = document.createElementNS(svgNS, "g");
        effectsGroup.setAttribute("id", "effects");
        svg.appendChild(effectsGroup);
    }
    // Crear un resplandor que se desvanece
    const glow = document.createElementNS(svgNS, "circle");
    glow.setAttribute("cx", (x + MIDAP / 2).toString());
    glow.setAttribute("cy", (y + MIDAP / 2).toString());
    glow.setAttribute("r", MIDAP.toString());
    glow.setAttribute("fill", "rgba(100, 100, 255, 0.6)");
    glow.setAttribute("filter", "blur(3px)");
    effectsGroup.appendChild(glow);
    // Animar el resplandor
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
        }
        else {
            glow.setAttribute("opacity", opacity.toString());
            // Efecto de expansión
            glow.setAttribute("r", (MIDAP * scale).toString());
        }
    }, 50);
}
// Función para detectar colisión entre nave y estrella usando hitbox cuadrada
export function detectarColision(jugador, estrella) {
    if (!jugador || !estrella)
        return false;
    // Usar hitbox cuadrada (AABB - Axis-Aligned Bounding Box)
    // Comprobar si hay solapamiento en ambos ejes
    const naveIzquierda = jugador.x;
    const naveDerecha = jugador.x + MIDAJ;
    const naveArriba = jugador.y;
    const naveAbajo = jugador.y + MIDAJ;
    const estrellaIzquierda = estrella.x;
    const estrellaDerecha = estrella.x + MIDAP;
    const estrellaArriba = estrella.y;
    const estrellaAbajo = estrella.y + MIDAP;
    // Hay colisión cuando no hay separación entre los rectángulos
    return (naveIzquierda < estrellaDerecha &&
        naveDerecha > estrellaIzquierda &&
        naveArriba < estrellaAbajo &&
        naveAbajo > estrellaArriba);
}
// Dibujar jugadores, estrellas y puntuación
export function dibuixar(jugadors, pedres) {
    initializeSvgStructure();
    let naveSrc;
    const svg = document.querySelector("svg");
    if (!svg) {
        console.error("Error: No se encontró el elemento SVG");
        return;
    }
    // Eliminar i redibuixar els jugadors
    const ply = svg.getElementById("players");
    if (!ply) {
        console.error("Error: No se encontró el elemento con ID 'players'");
        return;
    }
    while (ply.firstChild)
        ply.removeChild(ply.firstChild);
    for (const j of jugadors) {
        // Decidir qué imagen usar: nau3.png para el jugador actual, nau4.png para enemigos
        if (id !== undefined && id === j.id) {
            naveSrc = NAU_PROPIA; // Nave del jugador actual
        }
        else {
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
    const stn = svg.getElementById("stones");
    if (!stn) {
        console.error("Error: No se encontró el elemento con ID 'stones'");
        return;
    }
    while (stn.firstChild)
        stn.removeChild(stn.firstChild);
    for (const p of pedres) {
        // Usar imágenes SVG de estrellas
        const estrellaElement = imageSVG(p.x, p.y, MIDAP, MIDAP, ESTRELLA);
        // Añadir un identificador único para cada estrella
        if (p.id !== undefined) {
            estrellaElement.setAttribute("id", `estrella-${p.id}`);
        }
        stn.appendChild(estrellaElement);
    }
    // Mostrar la puntuación individual de cada jugador (ahora fuera del SVG)
    mostrarPuntuaciones(jugadors);
    // Actualizar el temporizador si está activo (ahora fuera del SVG)
    if (timerActive) {
        mostrarTemporizador();
    }
    // Comprobar si hay un ganador
    const ganador = jugadors.find((j) => j.puntuacion >= config.scoreLimit);
    if (ganador) {
        mostrarGanador(ganador.id);
        detenerTemporizador(); // Detener el temporizador si hay un ganador
    }
}
// Guardar i configurar les mides de la zona de joc
export function configurar(c) {
    // Guardar la configuración
    config = c;
    // Asegurar valores predeterminados
    if (config.scoreLimit === undefined) {
        config.scoreLimit = 10;
    }
    // Modificar la mida de la zona de joc
    const svg = document.querySelector("svg");
    if (!svg) {
        console.error("Error: No se encontró el elemento SVG");
        return;
    }
    svg.setAttribute("width", config.width.toString());
    svg.setAttribute("height", config.height.toString());
    svg.setAttribute("viewBox", "0 0 " + config.width + " " + config.height);
    // Inicializar la estructura SVG y precargar imágenes
    initializeSvgStructure();
    // Resetear el ganador al configurar un nuevo juego
    winner = null;
    // Limpiar pantalla de ganador si existe
    const winnerDisplay = svg.getElementById("winner-display");
    if (winnerDisplay) {
        svg.removeChild(winnerDisplay);
    }
}
// Función para mostrar el temporizador (fuera del SVG)
function mostrarTemporizador() {
    // Si no hay tiempo límite o el temporizador no está activo, no hacer nada
    if (!timerActive)
        return;
    // Buscar el contenedor del temporizador en HTML
    const timerContainer = document.getElementById("timer-container");
    if (!timerContainer)
        return;
    // Calcular minutos y segundos
    const minutos = Math.floor(remainingTime / 60);
    const segundos = remainingTime % 60;
    const tiempoFormateado = `${minutos}:${segundos < 10 ? "0" : ""}${segundos}`;
    // Color basado en el tiempo restante (rojo si queda poco tiempo, negro si hay suficiente tiempo)
    const colorTiempo = remainingTime < 30 ? "#ff3333" : "#000000";
    // Actualizar el contenido del temporizador
    timerContainer.innerHTML = `<div style="color: ${colorTiempo}">TIEMPO<br>${tiempoFormateado}</div>`;
}
// Función para actualizar el temporizador con el tiempo del servidor
export function actualizarTemporizador(tiempoRestante) {
    // Si no hay un temporizador activo, iniciar uno
    if (!timerActive) {
        timerActive = true;
        remainingTime = tiempoRestante;
        mostrarTemporizador();
        // Si ya hay un intervalo, eliminarlo para evitar duplicados
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
    }
    else {
        // Si ya hay un temporizador activo, solo actualizamos el tiempo
        // Este es un buen lugar para corregir desviaciones entre el cliente y el servidor
        const diferencia = Math.abs(remainingTime - tiempoRestante);
        // Si la diferencia es mayor a 2 segundos, sincronizar con el servidor
        if (diferencia > 2) {
            remainingTime = tiempoRestante;
            mostrarTemporizador();
        }
    }
}
// Función para iniciar o reiniciar el temporizador
export function iniciarTemporizador(tiempoTotal) {
    // Este método ahora solo se usará internamente
    // La sincronización principal vendrá del servidor
    detenerTemporizador();
    if (!tiempoTotal || tiempoTotal <= 0)
        return;
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
// Función para detener el temporizador
export function detenerTemporizador() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerActive = false;
    // Limpiar el contenedor del temporizador
    const timerContainer = document.getElementById("timer-container");
    if (timerContainer) {
        timerContainer.innerHTML = "";
    }
}
// Añadir una función para exponer el ID al exterior
export function setId(newId) {
    id = newId;
}
// Inicializar la estructura SVG y precargar las imágenes cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", () => {
    initializeSvgStructure();
    preloadImages();
});
