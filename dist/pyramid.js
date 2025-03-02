"use strict";
// Namespace per crear objectes SVG
const svgNS = "http://www.w3.org/2000/svg";
// Palmera
const palmtree = '<path style="stroke:#000;stroke-width:.46;fill:#800000" d="m3.1-72.3 5.8 3.4-4.2 5.3-4.2-2.4z"/>' +
    '<path style="stroke:#000;stroke-width:.55;fill:#800000" d="m-1.1-66.7 7.3 3.3-4.4 6.9-5.3-2.5z"/>' +
    '<path style="stroke:#000;stroke-width:.64;fill:#800000" d="m-5-60 8.8 3.2-4.4 8.4-6.4-2.4z"/>' +
    '<path style="stroke:#000;stroke-width:.73;fill:#800000" d="m-8.9-51.2 10.3 2.8-4.2 9.9-7.5-2z"/>' +
    '<path style="stroke:#000;stroke-width:.82;fill:#800000" d="m-12.6-40.6 11.8 2.1-3.7 11.5-8.5-1.5z"/>' +
    '<path style="stroke:#000;stroke-width:.91;fill:#800000" d="m-14.9-28.6 13.2 1.2-3 13.1-9.5-.8z"/>' +
    '<path style="stroke:#000;fill:#800000" d="m-16.2-15.4h14.5l-2 14.6h-10.5z"/>' +
    '<path style="stroke:#000;stroke-width:.6;fill:#008000" d="m8.1-78.2 2.7-4 .4-4.4 1.2 2.9 2-.2v-1.9l2.1 2 3 .7.4-3.4.9-.1 2 4.4.2 2.2 1.8-2.7-.9-4-3.1-3.3-3.2-1.6h-3.2l-3.2.9-3.2 3.3-1.2 3.7z"/>' +
    '<path style="stroke:#000;stroke-width:.6;fill:#008000" d="m5.1-66.7 3.8-3.8 4-5.3.8 5 3.4-1.1 3.6 1.3 1.2-3.4.9 3.7 2.9.2 2.2 2.5 1.4-4.8 1.8 6.6 3.7 3.6.1-7.7-2.3-5-5.2-3.5-5.7-2.1-6.6-.7-5.2.8-4.7 4.5-1.3 4.8z"/>' +
    '<path style="stroke:#000;stroke-width:.6;fill:#008000" d="m5.3-74 3.2-3.5-1-6.5-1-3.5-1.9-.3-1.9-1.8 3.3.4-.2-2.5-4-.8 1.7-.9-5.6-1.5-8.3.2-4.2 2.2-3.2 3.8 7-1.1 4.9-2.2-.9 2 4.8-1.3-3.7 3.3 2.3 2.5 4.3.4-2.7 1.8z"/>' +
    '<path style="stroke:#000;stroke-width:.6;fill:#008000" d="m5.2-75.2-4.3-5.7-8.2-4.5-9-1.6-8.2.6-5.9 2.7-2.9 4.5-1.5 7.4 4.8-2.4 3.8-4.9-1.2 5 7.1-3.5v-2.7l3.5-1.7-.9 5.1 4.5.8 2.3-2.8 2 3.2 8.6 2.1 5 5.5z"/>' +
    '<path style="stroke:#000;stroke-width:.6;fill:#008000" d="m5-66.7-5.8-1.8-3.1-4 .7 3.2-2.1 1.2-1.3-1.7-1 2.2-2.4 3.4-2.4-2.9-1.1.5.4 4.1.3 3-3.2-2.4-.9-3.1 1.1-4.5 2.2-3.3 3.2-2 3.8-1.2 5.3.9 3.7 2.4z"/>' +
    '<path style="stroke:#000;stroke-width:.6;fill:#008000" d="m4-67.1 3.8-.5 2.5 3.2 6.3-.8-4.8 3.9.7 1.9 5.3-.9-3.6 3 1.3 4 4.2-.2-3.4 2.2.8 1 4.4-1-.2.8-4.7 2.9-.1.9 2 .4 1.2-.8-.2.9-3.5 2.1-1.8 4.4 5.6-2.7 4.9-3.9 1.8-4.2.7-5.8-2.6-5.8-2.8-3.7-5.7-2.9-8.8-1.8-2.3 1.4z"/>';
// Factor d'escala
const ESCALA = 4;
// Mida del jugador i pedra
const MIDAJ = 4 * ESCALA;
const MIDAP = 2 * ESCALA;
// Mida de l'àrea de joc i piràmide
const PH = 4 * ESCALA;
const PV = 3 * ESCALA;
const NFPMAX = 8;
const PHMAX = PH * NFPMAX;
const PVMAX = PV * NFPMAX;
// Colors dels grups, del jugador i de les pedres
const COLOR_PYRA = ["#fff0f0", "#f0fff0"];
const COLOR_GRP = ["#ff0000", "#00ff00"];
const COLOR_PLY = ["#800000", "#008000"];
const COLOR_STN = "#a0a000";
let connexio;
// Inicializamos config con valores predeterminados para evitar error TS2739
let config = {
    width: 800, // valor predeterminado
    height: 600, // valor predeterminado
    pisos: 4, // valor predeterminado
};
let id;
let svgInitialized = false;
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
    // Crear grupos si no existen
    if (!svg.getElementById("pyramid")) {
        const pyramidGroup = document.createElementNS(svgNS, "g");
        pyramidGroup.setAttributeNS(null, "id", "pyramid");
        svg.appendChild(pyramidGroup);
    }
    if (!svg.getElementById("players")) {
        const playersGroup = document.createElementNS(svgNS, "g");
        playersGroup.setAttributeNS(null, "id", "players");
        svg.appendChild(playersGroup);
    }
    if (!svg.getElementById("stones")) {
        const stonesGroup = document.createElementNS(svgNS, "g");
        stonesGroup.setAttributeNS(null, "id", "stones");
        svg.appendChild(stonesGroup);
    }
    svgInitialized = true;
}
// Crear i configurar un rectangle SVG
function rectangleSVG(x, y, width, height, color) {
    const r = document.createElementNS(svgNS, "rect");
    r.setAttributeNS(null, "x", x.toString());
    r.setAttributeNS(null, "y", y.toString());
    r.setAttributeNS(null, "width", width.toString());
    r.setAttributeNS(null, "height", height.toString());
    r.setAttributeNS(null, "fill", color);
    return r;
}
// Afegir la zona per construir la piràmide d'un equip
function dibuixarZonaPiramide(x, y, team) {
    initializeSvgStructure();
    const svg = document.querySelector("svg");
    const pyramid = svg.getElementById("pyramid");
    if (!pyramid) {
        console.error("Error: No se encontró el elemento con ID 'pyramid'");
        return;
    }
    const g = document.createElementNS(svgNS, "g");
    g.setAttributeNS(null, "id", "T" + team);
    g.setAttributeNS(null, "transform", "translate(" + x + "," + y + ")");
    g.appendChild(rectangleSVG(0, 0, PHMAX, PVMAX, COLOR_PYRA[team]));
    pyramid.appendChild(g);
}
// Dibuixar la palmera per l'equip guanyador
function palmera(team) {
    initializeSvgStructure();
    const svg = document.querySelector("svg");
    const pyramid = svg.getElementById("T" + team);
    if (!pyramid) {
        console.error(`Error: No se encontró el elemento con ID 'T${team}'`);
        return;
    }
    const g = document.createElementNS(svgNS, "g");
    g.setAttributeNS(null, "transform", "translate(" +
        (PHMAX / 2 + config.pisos * 3) +
        " " +
        (PVMAX - ((NFPMAX - config.pisos) * PV) / 2) +
        ") scale(" +
        config.pisos / NFPMAX +
        ")");
    g.innerHTML = palmtree;
    pyramid.appendChild(g);
}
// Dibuixa els blocs de la piràmide d'un equip
function dibuixarPiramide(team, points) {
    initializeSvgStructure();
    const svg = document.querySelector("svg");
    const pyramid = svg.getElementById("T" + team);
    if (!pyramid) {
        console.error(`Error: No se encontró el elemento con ID 'T${team}'`);
        return;
    }
    const nc = pyramid.querySelectorAll("rect").length - 1;
    // Si no s'ha afegit cap bloc, retorna sense fer res
    if (points == nc)
        return;
    // Esborra tots els elements excepte el rectangle que indica la zona de construcció
    while (pyramid.firstElementChild &&
        pyramid.firstElementChild.nextElementSibling) {
        pyramid.removeChild(pyramid.firstElementChild.nextElementSibling);
    }
    // Dibuixa els blocs
    let np = 0, c = 0, f = config.pisos;
    let x = ((NFPMAX - config.pisos) * PH) / 2;
    let y = PVMAX - ((NFPMAX - config.pisos) * PV) / 2 - PV;
    while (np < points) {
        pyramid.appendChild(rectangleSVG(x, y, PH, PV, COLOR_STN));
        x += PH;
        ++c;
        if (c >= f) {
            x = x - f * PH + PH / 2;
            c = 0;
            --f;
            y -= PV;
        }
        ++np;
    }
    // Si s'han posat tots els blocs, dibuixa una palmera en la piràmide de l'equip guanyador
    if (points == config.pedres)
        palmera(team);
}
// Dibuixar jugadors, pedres i piràmides
//	jugadors: array d'objectes {x: , y: , id: id del jugador , team: 0/1}
//	pedres:   array d'objectes {x: , y: }
//	punts:   array amb dos enters (les pedres que ha posat cada equip)
export function dibuixar(jugadors, pedres, punts) {
    initializeSvgStructure();
    let c;
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
        if (id !== undefined && id === j.id)
            c = COLOR_PLY[j.team];
        else
            c = COLOR_GRP[j.team];
        ply.appendChild(rectangleSVG(j.x, j.y, MIDAJ, MIDAJ, c));
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
        stn.appendChild(rectangleSVG(p.x, p.y, MIDAP, MIDAP, COLOR_STN));
    }
    // Dibuixar les piràmides de cada equip
    dibuixarPiramide(0, punts[0]);
    dibuixarPiramide(1, punts[1]);
}
// Guardar i configurar les mides de la zona de joc
//	i el nombre de pisos que ha tenir cada piràmide
// Dibuixar les zones on s'han de construir les piràmides
// c.width: amplada en píxels
// c.height: alçada en píxels
// c.pisos: nombre de pisos de la piràmide
// c.pedres: nombre de pedres necessàries per contruir la piràmide:
//	(pisos + 1) * pisos / 2
export function configurar(c) {
    // Guardar la configuració
    config = c;
    config.pedres = ((config.pisos + 1) * config.pisos) / 2;
    // Modificar la mida de la zona de joc
    const svg = document.querySelector("svg");
    if (!svg) {
        console.error("Error: No se encontró el elemento SVG");
        return;
    }
    svg.setAttribute("width", config.width.toString());
    svg.setAttribute("height", config.height.toString());
    svg.setAttribute("viewBox", "0 0 " + config.width + " " + config.height);
    // Inicializar la estructura SVG
    initializeSvgStructure();
    // Dibuixar les zones on s'han de construir les piràmides
    const pyramid = svg.getElementById("pyramid");
    if (!pyramid) {
        console.error("Error: No se encontró el elemento con ID 'pyramid'");
        return;
    }
    while (pyramid.firstChild)
        pyramid.removeChild(pyramid.firstChild);
    dibuixarZonaPiramide(0, 0, 0);
    dibuixarZonaPiramide(config.width - PHMAX, config.height - PVMAX, 1);
}
// Añadir una función para exponer el ID al exterior
export function setId(newId) {
    id = newId;
}
// Inicializar la estructura SVG cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", initializeSvgStructure);
