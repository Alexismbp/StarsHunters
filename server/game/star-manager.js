/**
 * Gestión de estrellas en el juego
 */

const gameConfig = require("../config/game-config");

// Variables de estado
let estrellas = [];
let estrellasTimers = {};
let idEstrella = 1;

const starManager = {
  // Getters
  getAllStars: () => [...estrellas],
  getStar: (id) => estrellas.find((e) => e.id === id),

  // Inicializar estrellas al inicio del juego
  initializeStars: () => {
    // Limpiar temporizadores antiguos
    Object.values(estrellasTimers).forEach((timer) => clearTimeout(timer));
    estrellasTimers = {};

    estrellas = []; // Limpiar estrellas existentes

    // Generar estrellas iniciales
    for (let i = 0; i < gameConfig.MAXPED; i++) {
      estrellas.push(starManager.generateStar());
    }

    return estrellas;
  },

  // Generar una nueva estrella
  generateStar: () => {
    const config = gameConfig.getConfig();
    const margen = gameConfig.MIDAP * 2;

    // Generar posición aleatoria evitando los bordes
    const x = margen + Math.random() * (config.width - margen * 2);
    const y = margen + Math.random() * (config.height - margen * 2);

    // Asignar ID único
    const id = idEstrella++;

    // Tiempo de vida aleatorio entre 15 y 45 segundos
    const tiempoVida = 15000 + Math.random() * 30000;

    // Crear la estrella
    const estrella = { x, y, id };

    // Programar su reposicionamiento
    starManager.scheduleStarRepositioning(estrella, tiempoVida);

    return estrella;
  },

  // Programar el temporizador para reposicionar una estrella
  scheduleStarRepositioning: (estrella, tiempoVida) => {
    // Cancelar temporizador anterior si existe
    if (estrellasTimers[estrella.id]) {
      clearTimeout(estrellasTimers[estrella.id]);
    }

    // Solo programar si tenemos un tiempo de vida válido
    if (!tiempoVida || tiempoVida <= 0) return;

    // Crear nuevo temporizador
    estrellasTimers[estrella.id] = setTimeout(() => {
      // Buscar y eliminar la estrella
      const index = estrellas.findIndex((e) => e.id === estrella.id);
      if (index !== -1) {
        estrellas.splice(index, 1);

        // Notificar la desaparición (esta función debe implementarse en websocket-server.js)
        if (typeof starManager.onStarDisappear === "function") {
          starManager.onStarDisappear(estrella.id);
        }

        // Crear nueva estrella en otra posición
        const nuevaEstrella = starManager.generateStar();
        estrellas.push(nuevaEstrella);

        // Notificar actualizaciones
        if (typeof starManager.onStarsUpdated === "function") {
          starManager.onStarsUpdated(estrellas);
        }
      }
    }, tiempoVida);
  },

  // Eliminar una estrella cuando es recogida por un jugador
  removeStar: (starId) => {
    const index = estrellas.findIndex((e) => e.id === starId);
    if (index === -1) return null;

    // Obtener la estrella antes de eliminarla
    const estrella = estrellas[index];

    // Cancelar el temporizador
    if (estrellasTimers[starId]) {
      clearTimeout(estrellasTimers[starId]);
      delete estrellasTimers[starId];
    }

    // Eliminar la estrella
    estrellas.splice(index, 1);

    // Generar nueva estrella
    const nuevaEstrella = starManager.generateStar();
    estrellas.push(nuevaEstrella);

    return {
      removedStar: estrella,
      newStar: nuevaEstrella,
    };
  },

  // Limpiar todos los temporizadores
  clearTimers: () => {
    Object.values(estrellasTimers).forEach((timer) => clearTimeout(timer));
    estrellasTimers = {};
  },

  // Para mantener el número de estrellas
  ensureStarCount: () => {
    while (estrellas.length < gameConfig.MAXPED) {
      estrellas.push(starManager.generateStar());
    }
    return estrellas;
  },

  // Callbacks para notificaciones (serán asignados externamente)
  onStarDisappear: null,
  onStarsUpdated: null,
};

module.exports = starManager;
